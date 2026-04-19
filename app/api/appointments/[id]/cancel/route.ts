import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const { id } = await params

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      )
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, patient_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Запис не знайдено' },
        { status: 404 }
      )
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Недостатньо прав' },
        { status: 403 }
      )
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { success: false, error: 'Цей запис не можна скасувати' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      captureException(new Error('[cancel] Update error'), {
        supabaseError: updateError,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося скасувати запис' },
        { status: 500 }
      )
    }

    // Queue cancellation email if user has an email
    if (user.email) {
      await supabase
        .from('notification_events')
        .insert({
          type: 'appointment_cancellation',
          appointment_id: id,
          recipient_email: user.email,
          status: 'queued',
          details: { cancelledBy: 'patient' },
        })
        .then(({ error: notifErr }) => {
          if (notifErr) {
            logger.warn('[cancel] Failed to queue cancellation email:', {
              data: notifErr.message,
            })
          }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
