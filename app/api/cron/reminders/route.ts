import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const CRON_SECRET = process.env.CRON_SECRET ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createClient<any, 'public', any>>

function getServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * GET /api/cron/reminders
 * Runs daily at 18:00 UTC (20:00 Kyiv).
 * Finds confirmed/pending appointments for tomorrow and inserts
 * appointment_reminder events scheduled for 09:00 Kyiv time (07:00 UTC).
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

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({
      success: true,
      message: 'Supabase service role not configured — skipping',
      scheduled: 0,
    })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().slice(0, 10)

  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('id, guest_email, appointment_date, appointment_time')
    .eq('appointment_date', tomorrowDate)
    .in('status', ['pending', 'confirmed'])

  if (apptError) {
    captureException(new Error('[cron/reminders] Query error'), {
      supabaseError: apptError,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to query appointments' },
      { status: 500 }
    )
  }

  if (!appointments?.length) {
    return NextResponse.json({
      success: true,
      message: 'No appointments tomorrow',
      scheduled: 0,
    })
  }

  const eligibleAppointments = appointments.filter(
    (a: { guest_email: string | null }) => a.guest_email?.trim()
  )

  if (eligibleAppointments.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No appointments with email tomorrow',
      scheduled: 0,
    })
  }

  const { data: existingReminders } = await supabase
    .from('notification_events')
    .select('appointment_id')
    .eq('type', 'appointment_reminder')
    .in(
      'appointment_id',
      eligibleAppointments.map((a: { id: string }) => a.id)
    )

  const alreadyScheduled = new Set(
    (existingReminders ?? []).map(
      (r: { appointment_id: string }) => r.appointment_id
    )
  )

  const reminderDeliveryTime = new Date(tomorrowDate + 'T07:00:00Z')

  const events = eligibleAppointments
    .filter((a: { id: string }) => !alreadyScheduled.has(a.id))
    .map((a: { id: string; guest_email: string }) => ({
      type: 'appointment_reminder',
      appointment_id: a.id,
      recipient_email: a.guest_email,
      status: 'queued',
      scheduled_at: reminderDeliveryTime.toISOString(),
      details: { source: 'cron_reminder' },
    }))

  if (events.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All reminders already scheduled',
      scheduled: 0,
    })
  }

  const { error: insertError } = await supabase
    .from('notification_events')
    .insert(events)

  if (insertError) {
    captureException(new Error('[cron/reminders] Insert error'), {
      supabaseError: insertError,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to insert reminder events' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    scheduled: events.length,
    date: tomorrowDate,
  })
}
