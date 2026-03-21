import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type BookingNotificationBody = {
  appointmentId?: string
  email?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseBody(value: unknown): BookingNotificationBody | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as BookingNotificationBody
}

/** POST /api/notifications/booking */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const parsed = parseBody(await request.json().catch(() => null))
  if (!parsed) {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  const appointmentId = parsed.appointmentId?.trim()
  const email = parsed.email?.trim().toLowerCase()

  if (!appointmentId) {
    return NextResponse.json(
      { success: false, error: 'appointmentId є обовʼязковим' },
      { status: 400 }
    )
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Невалідний email' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({
      success: true,
      data: { sent: false },
    })
  }

  const { error } = await supabase.from('notification_events').insert({
    type: 'booking_confirmation',
    appointment_id: appointmentId,
    recipient_email: email,
    status: 'queued',
    details: {
      source: 'webapp',
      userAgent: request.headers.get('user-agent'),
    },
  })

  if (error) {
    // Keep booking flow non-blocking until DB migration/policies land everywhere.
    if (['42P01', 'PGRST205', '42501'].includes(error.code ?? '')) {
      return NextResponse.json({
        success: true,
        data: { sent: false },
      })
    }

    console.error('[notifications/booking] Supabase error:', error)
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити notification event' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: { sent: true },
    },
    { status: 202 }
  )
}
