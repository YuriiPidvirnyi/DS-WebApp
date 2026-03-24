import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const { id } = await params

  let body: { newDate?: string; newTime?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невалідний запит' },
      { status: 400 }
    )
  }

  if (!body.newDate || !body.newTime) {
    return NextResponse.json(
      { success: false, error: 'Нова дата та час є обовʼязковими' },
      { status: 400 }
    )
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const timeRegex = /^\d{2}:\d{2}$/

  if (!dateRegex.test(body.newDate) || !timeRegex.test(body.newTime)) {
    return NextResponse.json(
      { success: false, error: 'Невірний формат дати або часу' },
      { status: 400 }
    )
  }

  const newDate = new Date(`${body.newDate}T${body.newTime}`)
  if (newDate <= new Date()) {
    return NextResponse.json(
      { success: false, error: 'Нова дата повинна бути в майбутньому' },
      { status: 400 }
    )
  }

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
        { success: false, error: 'Цей запис не можна перенести' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        appointment_date: body.newDate,
        appointment_time: body.newTime,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      captureException(new Error('[reschedule] Update error'), {
        supabaseError: updateError,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося перенести запис' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        newDate: body.newDate,
        newTime: body.newTime,
        status: 'pending',
      },
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
