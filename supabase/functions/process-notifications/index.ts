// Supabase Edge Function: process-notifications
//
// Drains the `notification_events` queue and sends emails via Resend. This is a
// 1:1 port of the retired Vercel route `app/api/cron/notifications/route.ts`.
// Invoked every 5 minutes by pg_cron (see supabase/migrations/*_cron_schedules.sql)
// via net.http_post with an `Authorization: Bearer <NOTIFY_FN_SECRET>` header.
//
// Deployed with verify_jwt=false — the auth gate below is the shared-secret check.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail, isEmailConfigured } from './_shared/email.ts'
import {
  bookingConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newBookingAdminEmail,
  recallEmail,
  reviewRequestEmail,
} from './_shared/email-templates.ts'

const INVOKE_SECRET = Deno.env.get('NOTIFY_FN_SECRET') ?? ''
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? ''
const BATCH_SIZE = 20
const MAX_ATTEMPTS = 3
// Rows stuck in 'processing' longer than this are re-queued (guards crashed workers)
const STUCK_TIMEOUT_MS = 10 * 60 * 1000

// deno-lint-ignore no-explicit-any
type ServiceClient = SupabaseClient<any, 'public', any>

type NotificationRow = {
  id: string
  type: string
  appointment_id: string | null
  recipient_email: string
  status: string
  details: Record<string, unknown>
  attempts: number
}

type AppointmentData = {
  patient_name: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  appointment_date: string
  appointment_time: string
  services: { name_uk: string } | { name_uk: string }[] | null
  doctors:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function resolveServiceName(services: AppointmentData['services']): string {
  if (!services) return '—'
  if (Array.isArray(services)) return services[0]?.name_uk ?? '—'
  return services.name_uk ?? '—'
}

function resolveDoctorName(
  doctors: AppointmentData['doctors']
): string | undefined {
  if (!doctors) return undefined
  const doc = Array.isArray(doctors) ? doctors[0] : doctors
  if (!doc) return undefined
  return `${doc.first_name} ${doc.last_name}`.trim() || undefined
}

async function startCronRun(
  supabase: ServiceClient,
  name: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('cron_runs')
      .insert({ name, status: 'running' })
      .select('id')
      .single()
    return (data as { id: string } | null)?.id ?? null
  } catch {
    return null
  }
}

async function finishCronRun(
  supabase: ServiceClient,
  runId: string | null,
  status: 'ok' | 'error',
  processed: number,
  error?: string
): Promise<void> {
  if (!runId) return
  try {
    await supabase
      .from('cron_runs')
      .update({
        status,
        finished_at: new Date().toISOString(),
        processed,
        ...(error ? { error } : {}),
      })
      .eq('id', runId)
  } catch {
    // non-blocking — cron_runs is observability only
  }
}

async function processLowStockAlert(
  supabase: ServiceClient,
  event: NotificationRow
): Promise<void> {
  const details = event.details ?? {}
  const subject =
    typeof details.subject === 'string'
      ? details.subject
      : 'Dental Story — низький залишок матеріалів'
  const text =
    typeof details.text === 'string'
      ? details.text
      : 'Зверніть увагу на залишки матеріалів.'

  const materials = Array.isArray(details.materials)
    ? (details.materials as { name: string; current: number; min: number }[])
    : []

  const rows = materials
    .map(
      m =>
        `<tr><td style="padding:4px 12px 4px 0">${m.name}</td><td style="padding:4px 12px 4px 0">${m.current}</td><td style="padding:4px 0">${m.min}</td></tr>`
    )
    .join('')

  const html = `<div style="font-family:sans-serif;color:#2C3E42;max-width:600px">
<h2 style="color:#5A8A94">${subject}</h2>
<p>${text.replace(/\n/g, '<br>')}</p>
${
  rows
    ? `<table style="border-collapse:collapse;margin-top:8px"><thead><tr>
<th style="text-align:left;padding:4px 12px 4px 0;border-bottom:1px solid #ccc">Матеріал</th>
<th style="text-align:left;padding:4px 12px 4px 0;border-bottom:1px solid #ccc">Поточний залишок</th>
<th style="text-align:left;padding:4px 0;border-bottom:1px solid #ccc">Мін. залишок</th>
</tr></thead><tbody>${rows}</tbody></table>`
    : ''
}
</div>`

  const result = await sendEmail({
    to: event.recipient_email,
    subject,
    html,
    text,
    tags: [{ name: 'type', value: 'low_stock_alert' }],
  })

  await supabase
    .from('notification_events')
    .update({
      status: result.success
        ? 'sent'
        : event.attempts + 1 >= MAX_ATTEMPTS
          ? 'failed'
          : 'queued',
      ...(result.success ? { resend_id: result.id } : { error: result.error }),
      processed_at: new Date().toISOString(),
      attempts: event.attempts + 1,
      claimed_at: null,
    })
    .eq('id', event.id)
}

async function processEvent(
  supabase: ServiceClient,
  event: NotificationRow,
  appointment: AppointmentData | null = null
) {
  if (event.type === 'low_stock_alert') {
    await processLowStockAlert(supabase, event)
    return
  }

  if (
    event.type === 'recall_touch_1' ||
    event.type === 'recall_touch_2' ||
    event.type === 'recall_touch_3'
  ) {
    const touch = parseInt(event.type.slice(-1), 10) as 1 | 2 | 3
    const patientName =
      typeof event.details?.patient_name === 'string'
        ? event.details.patient_name
        : 'Шановний пацієнт'
    const locale =
      (event.details?.locale as 'uk' | 'en' | 'pl' | undefined) ?? 'uk'
    const email = recallEmail({ patientName, touch }, locale)
    const result = await sendEmail({
      to: event.recipient_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: 'type', value: event.type }],
    })
    await supabase
      .from('notification_events')
      .update({
        status: result.success
          ? 'sent'
          : event.attempts + 1 >= MAX_ATTEMPTS
            ? 'failed'
            : 'queued',
        ...(result.success
          ? { resend_id: result.id }
          : { error: result.error }),
        processed_at: new Date().toISOString(),
        attempts: event.attempts + 1,
        claimed_at: null,
      })
      .eq('id', event.id)
    return
  }

  if (!appointment) {
    await supabase
      .from('notification_events')
      .update({
        status: 'failed',
        error: 'Appointment not found',
        processed_at: new Date().toISOString(),
        attempts: event.attempts + 1,
      })
      .eq('id', event.id)
    return
  }

  const patientName =
    appointment.patient_name || appointment.guest_name || 'Шановний пацієнт'
  const service = resolveServiceName(appointment.services)
  const doctorName = resolveDoctorName(appointment.doctors)

  const locale =
    (event.details?.locale as 'uk' | 'en' | 'pl' | undefined) ?? 'uk'

  let email: { subject: string; html: string; text: string } | null = null
  let to = event.recipient_email

  switch (event.type) {
    case 'booking_confirmation':
      email = bookingConfirmationEmail(
        {
          patientName,
          service,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          appointmentId: event.appointment_id ?? '',
          doctorName,
        },
        locale
      )
      break

    case 'appointment_reminder':
      email = appointmentReminderEmail(
        {
          patientName,
          service,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          appointmentId: event.appointment_id ?? '',
          doctorName,
        },
        locale
      )
      break

    case 'appointment_cancellation':
      email = appointmentCancellationEmail(
        {
          patientName,
          service,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          reason: (event.details?.reason as string) ?? undefined,
        },
        locale
      )
      break

    case 'review_request':
      email = reviewRequestEmail({ patientName }, locale)
      break

    case 'new_booking_admin':
      if (!ADMIN_EMAIL) {
        await supabase
          .from('notification_events')
          .update({
            status: 'failed',
            error: 'ADMIN_NOTIFICATION_EMAIL not configured',
            processed_at: new Date().toISOString(),
            attempts: event.attempts + 1,
          })
          .eq('id', event.id)
        return
      }
      to = ADMIN_EMAIL
      email = newBookingAdminEmail({
        patientName,
        phone: appointment.guest_phone ?? '—',
        email: appointment.guest_email ?? '—',
        service,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        appointmentId: event.appointment_id ?? '',
      })
      break
  }

  if (!email) {
    await supabase
      .from('notification_events')
      .update({
        status: 'failed',
        error: `Unknown event type: ${event.type}`,
        processed_at: new Date().toISOString(),
        attempts: event.attempts + 1,
      })
      .eq('id', event.id)
    return
  }

  const result = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: [
      { name: 'type', value: event.type },
      ...(event.appointment_id
        ? [{ name: 'appointment', value: event.appointment_id }]
        : []),
    ],
  })

  if (result.success) {
    await supabase
      .from('notification_events')
      .update({
        status: 'sent',
        resend_id: result.id,
        processed_at: new Date().toISOString(),
        attempts: event.attempts + 1,
      })
      .eq('id', event.id)

    console.log('[process-notifications] delivered', {
      id: event.id,
      type: event.type,
      resendId: result.id,
    })
  } else {
    const newAttempts = event.attempts + 1
    await supabase
      .from('notification_events')
      .update({
        status: newAttempts >= MAX_ATTEMPTS ? 'failed' : 'queued',
        error: result.error,
        processed_at: new Date().toISOString(),
        attempts: newAttempts,
      })
      .eq('id', event.id)
  }
}

Deno.serve(async (request: Request) => {
  // Auth gate: missing config and wrong credentials both return 401.
  const authHeader = request.headers.get('authorization')
  if (!INVOKE_SECRET || authHeader !== `Bearer ${INVOKE_SECRET}`) {
    return json({ success: false, error: 'Unauthorized' }, 401)
  }

  if (!isEmailConfigured()) {
    return json({
      success: true,
      message: 'Email not configured — skipping',
      processed: 0,
    })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return json({
      success: true,
      message: 'Supabase service role not configured — skipping',
      processed: 0,
    })
  }
  const supabase = createClient(url, key)

  const runId = await startCronRun(supabase, 'notifications')

  // Recycle rows stuck in 'processing' from a previous crashed run
  const stuckCutoff = new Date(Date.now() - STUCK_TIMEOUT_MS).toISOString()
  await supabase
    .from('notification_events')
    .update({ status: 'queued', claimed_at: null })
    .eq('status', 'processing')
    .lt('claimed_at', stuckCutoff)

  // Step 1: Select candidate IDs
  const { data: candidates, error: selectError } = await supabase
    .from('notification_events')
    .select('id')
    .eq('status', 'queued')
    .lt('attempts', MAX_ATTEMPTS)
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (selectError) {
    console.error('[process-notifications] Query error', selectError)
    await finishCronRun(supabase, runId, 'error', 0, selectError.message)
    return json({ success: false, error: 'Failed to query events' }, 500)
  }

  if (!candidates?.length) {
    await finishCronRun(supabase, runId, 'ok', 0)
    return json({
      success: true,
      message: 'No queued notifications',
      processed: 0,
    })
  }

  const candidateIds = candidates.map(r => r.id as string)

  // Step 2: Claim rows atomically — the .eq('status','queued') guard means a
  // concurrent run that selected the same IDs updates 0 rows for any already claimed.
  const { data: events, error: claimError } = await supabase
    .from('notification_events')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
    })
    .in('id', candidateIds)
    .eq('status', 'queued')
    .select(
      'id, type, appointment_id, recipient_email, status, details, attempts'
    )

  if (claimError) {
    console.error('[process-notifications] Claim error', claimError)
    await finishCronRun(supabase, runId, 'error', 0, claimError.message)
    return json({ success: false, error: 'Failed to claim events' }, 500)
  }

  if (!events?.length) {
    await finishCronRun(supabase, runId, 'ok', 0)
    return json({
      success: true,
      message: 'No notifications claimed (concurrent run took them)',
      processed: 0,
    })
  }

  // Collect unique appointment IDs (filter out null/undefined)
  const appointmentIds = [
    ...new Set(
      (events as NotificationRow[])
        .map(e => e.appointment_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  // Single batch fetch for all appointments in this batch
  const { data: appointmentsData } = appointmentIds.length
    ? await supabase
        .from('appointments')
        .select(
          'id, patient_name, guest_name, guest_phone, guest_email, appointment_date, appointment_time, services(name_uk), doctors(first_name,last_name)'
        )
        .in('id', appointmentIds)
    : { data: [] }

  const appointmentsMap = new Map(
    (appointmentsData ?? []).map(a => [
      a.id as string,
      a as unknown as AppointmentData,
    ])
  )

  let processed = 0
  let failed = 0

  for (const event of events as NotificationRow[]) {
    try {
      await processEvent(
        supabase,
        event,
        (event.appointment_id
          ? appointmentsMap.get(event.appointment_id)
          : undefined) ?? null
      )
      processed++
    } catch (err) {
      failed++
      console.error('[process-notifications] Failed to process', event.id, err)
      // Reset claimed row so it can be retried next run
      await supabase
        .from('notification_events')
        .update({ status: 'queued', claimed_at: null })
        .eq('id', event.id)
        .eq('status', 'processing')
    }
  }

  await finishCronRun(supabase, runId, 'ok', processed)

  return json({
    success: true,
    processed,
    failed,
    total: events.length,
  })
})
