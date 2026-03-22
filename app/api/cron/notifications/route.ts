import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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

async function processEvent(supabase: ServiceClient, event: NotificationRow) {
  const { data: appointment } = await supabase
    .from('appointments')
    .select(
      'patient_name, guest_name, guest_phone, guest_email, appointment_date, appointment_time, services(name_uk), doctors(first_name,last_name)'
    )
    .eq('id', event.appointment_id)
    .maybeSingle()

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

  const appt = appointment as unknown as AppointmentData
  const patientName = appt.patient_name || appt.guest_name || 'Шановний пацієнт'
  const service = resolveServiceName(appt.services)
  const doctorName = resolveDoctorName(appt.doctors)

  let email: { subject: string; html: string; text: string } | null = null
  let to = event.recipient_email

  switch (event.type) {
    case 'booking_confirmation':
      email = bookingConfirmationEmail({
        patientName,
        service,
        date: appt.appointment_date,
        time: appt.appointment_time,
        appointmentId: event.appointment_id,
        doctorName,
      })
      break

    case 'appointment_reminder':
      email = appointmentReminderEmail({
        patientName,
        service,
        date: appt.appointment_date,
        time: appt.appointment_time,
        appointmentId: event.appointment_id,
        doctorName,
      })
      break

    case 'appointment_cancellation':
      email = appointmentCancellationEmail({
        patientName,
        service,
        date: appt.appointment_date,
        time: appt.appointment_time,
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
        phone: appt.guest_phone ?? '—',
        email: appt.guest_email ?? '—',
        service,
        date: appt.appointment_date,
        time: appt.appointment_time,
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
 */
export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
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

  const { data: events, error } = await supabase
    .from('notification_events')
    .select(
      'id, type, appointment_id, recipient_email, status, details, attempts'
    )
    .eq('status', 'queued')
    .lt('attempts', MAX_ATTEMPTS)
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    captureException(new Error('[cron/notifications] Query error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to query events' },
      { status: 500 }
    )
  }

  if (!events?.length) {
    return NextResponse.json({
      success: true,
      message: 'No queued notifications',
      processed: 0,
    })
  }

  let processed = 0
  let failed = 0

  for (const event of events as NotificationRow[]) {
    try {
      await processEvent(supabase, event)
      processed++
    } catch (err) {
      failed++
      captureException(
        err instanceof Error
          ? err
          : new Error(`[cron/notifications] Failed to process ${event.id}`)
      )
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    failed,
    total: events.length,
  })
}
