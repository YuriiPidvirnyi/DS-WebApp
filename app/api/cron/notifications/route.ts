import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import {
  bookingConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newBookingAdminEmail,
} from '@/lib/email-templates'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET ?? ''
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? ''
const BATCH_SIZE = 20
const MAX_ATTEMPTS = 3
// Rows stuck in 'processing' longer than this are re-queued (guards crashed workers)
const STUCK_TIMEOUT_MS = 10 * 60 * 1000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, 'public', any>

function getServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

type NotificationRow = {
  id: string
  type: string
  appointment_id: string
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

async function processEvent(
  supabase: ServiceClient,
  event: NotificationRow,
  appointment: AppointmentData | null = null
) {
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

  let email: { subject: string; html: string; text: string } | null = null
  let to = event.recipient_email

  switch (event.type) {
    case 'booking_confirmation':
      email = bookingConfirmationEmail({
        patientName,
        service,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        appointmentId: event.appointment_id,
        doctorName,
      })
      break

    case 'appointment_reminder':
      email = appointmentReminderEmail({
        patientName,
        service,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        appointmentId: event.appointment_id,
        doctorName,
      })
      break

    case 'appointment_cancellation':
      email = appointmentCancellationEmail({
        patientName,
        service,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        reason: (event.details?.reason as string) ?? undefined,
      })
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
        appointmentId: event.appointment_id,
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
      { name: 'appointment', value: event.appointment_id },
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

    console.info('[cron/notifications] delivered', {
      id: event.id,
      type: event.type,
      resendId: result.id,
    })
    Sentry.addBreadcrumb({
      category: 'email',
      message: 'delivered',
      level: 'info',
      data: { id: event.id, type: event.type, resendId: result.id },
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

/**
 * GET /api/cron/notifications
 * Called by Vercel Cron every 5 minutes.
 * Processes queued notification_events and sends emails via Resend.
 *
 * Idempotency: rows are claimed (status → 'processing') before being sent so a
 * concurrent re-fire cannot double-send. Stuck 'processing' rows older than
 * STUCK_TIMEOUT_MS are recycled back to 'queued' at the start of each run.
 */
export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      success: true,
      message: 'Email not configured — skipping',
      processed: 0,
    })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({
      success: true,
      message: 'Supabase service role not configured — skipping',
      processed: 0,
    })
  }

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
    captureException(new Error('[cron/notifications] Query error'), {
      supabaseError: selectError,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to query events' },
      { status: 500 }
    )
  }

  if (!candidates?.length) {
    return NextResponse.json({
      success: true,
      message: 'No queued notifications',
      processed: 0,
    })
  }

  const candidateIds = candidates.map(r => r.id as string)

  // Step 2: Claim rows atomically — the .eq('status', 'queued') guard means
  // a concurrent cron that selected the same IDs will update 0 rows for any
  // already claimed here.
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
    captureException(new Error('[cron/notifications] Claim error'), {
      supabaseError: claimError,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to claim events' },
      { status: 500 }
    )
  }

  if (!events?.length) {
    return NextResponse.json({
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
        appointmentsMap.get(event.appointment_id) ?? null
      )
      processed++
    } catch (err) {
      failed++
      captureException(
        err instanceof Error
          ? err
          : new Error(`[cron/notifications] Failed to process ${event.id}`)
      )
      // Reset claimed row so it can be retried next run
      await supabase
        .from('notification_events')
        .update({ status: 'queued', claimed_at: null })
        .eq('id', event.id)
        .eq('status', 'processing')
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    failed,
    total: events.length,
  })
}
