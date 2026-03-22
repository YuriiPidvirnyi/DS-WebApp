import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }
type ReminderPreference = 'email' | 'sms' | 'both' | 'none'

function isReminderPreference(value: unknown): value is ReminderPreference {
  return (
    value === 'email' || value === 'sms' || value === 'both' || value === 'none'
  )
}

/** PATCH /api/appointments/:id/reminder-preference */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const { id } = await params
  if (!id?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Невалідний appointment id' },
      { status: 400 }
    )
  }

  let body: { preference?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (!isReminderPreference(body.preference)) {
    return NextResponse.json(
      { success: false, error: 'Невалідне значення preference' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({
      success: true,
      data: { updated: false },
    })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('id', id)
    .maybeSingle()

  if (!appointment) {
    return NextResponse.json(
      { success: false, error: 'Запис не знайдено' },
      { status: 404 }
    )
  }

  if (appointment.patient_id !== user.id) {
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      )
    }
  }

  const now = new Date().toISOString()
  const { error: insertError } = await supabase
    .from('appointment_reminder_preferences')
    .insert({
      appointment_id: id,
      preference: body.preference,
      updated_at: now,
    })

  if (!insertError) {
    return NextResponse.json({
      success: true,
      data: { updated: true },
    })
  }

  if (insertError.code === '23505') {
    const { error: updateError } = await supabase
      .from('appointment_reminder_preferences')
      .update({
        preference: body.preference,
        updated_at: now,
      })
      .eq('appointment_id', id)

    if (!updateError) {
      return NextResponse.json({
        success: true,
        data: { updated: true },
      })
    }

    // Graceful mode until migration/policies land in all environments.
    if (['42P01', 'PGRST205', '42501'].includes(updateError.code ?? '')) {
      return NextResponse.json({
        success: true,
        data: { updated: false },
      })
    }

    captureException(new Error('[reminder-preference] Supabase update error'), {
      supabaseError: updateError,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити preference' },
      { status: 500 }
    )
  }

  // Graceful mode until migration/policies land in all environments.
  if (['42P01', 'PGRST205', '42501'].includes(insertError.code ?? '')) {
    return NextResponse.json({
      success: true,
      data: { updated: false },
    })
  }

  captureException(new Error('[reminder-preference] Supabase insert error'), {
    supabaseError: insertError,
  })
  return NextResponse.json(
    { success: false, error: 'Не вдалося оновити preference' },
    { status: 500 }
  )
}
