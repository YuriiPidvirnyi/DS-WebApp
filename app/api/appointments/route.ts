import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { parsePagination, paginationMeta } from '@/lib/pagination'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type BookingPayload = {
  name: string
  phone: string
  email: string
  service: string
  message?: string
  preferredDate: string
  preferredTime: string
  doctorId?: string
}

function isBookingPayload(
  body: Partial<BookingPayload>
): body is BookingPayload {
  return (
    typeof body.name === 'string' &&
    typeof body.phone === 'string' &&
    typeof body.email === 'string' &&
    typeof body.service === 'string' &&
    typeof body.preferredDate === 'string' &&
    typeof body.preferredTime === 'string'
  )
}

async function createSupabaseAppointment(payload: BookingPayload) {
  const supabase = await createSupabaseClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: serviceRecord } = await supabase
    .from('services')
    .select('id')
    .eq('name_uk', payload.service)
    .eq('is_active', true)
    .maybeSingle()

  const appointmentId = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const { error } = await supabase.from('appointments').insert({
    id: appointmentId,
    patient_id: user?.id ?? null,
    service_id: serviceRecord?.id ?? null,
    doctor_id: payload.doctorId?.trim() || null,
    patient_name: payload.name.trim(),
    guest_name: payload.name.trim(),
    guest_phone: payload.phone.trim(),
    guest_email: payload.email.trim() || null,
    appointment_date: payload.preferredDate,
    appointment_time: payload.preferredTime,
    duration_minutes: 30,
    status: 'pending',
    notes: payload.message?.trim() || null,
    source: 'website',
    created_at: createdAt,
  })

  if (error) {
    captureException(new Error('[appointments] Supabase create error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити запис' },
      { status: 500 }
    )
  }

  const guestEmail = payload.email.trim()
  if (guestEmail) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? ''
    const notifEvents = [
      {
        type: 'booking_confirmation',
        appointment_id: appointmentId,
        recipient_email: guestEmail,
        status: 'queued',
        details: { source: 'webapp' },
      },
      ...(adminEmail
        ? [
            {
              type: 'new_booking_admin',
              appointment_id: appointmentId,
              recipient_email: adminEmail,
              status: 'queued',
              details: { source: 'webapp' },
            },
          ]
        : []),
    ]
    supabase
      .from('notification_events')
      .insert(notifEvents)
      .then(({ error: notifErr }) => {
        if (notifErr)
          console.warn(
            '[appointments] Failed to queue notifications:',
            notifErr.message
          )
      })
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: appointmentId,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: guestEmail,
        service: payload.service.trim(),
        message: payload.message?.trim() || '',
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        status: 'pending',
        createdAt,
      },
    },
    { status: 201 }
  )
}

const APPOINTMENT_SELECT =
  'id, patient_name, guest_name, guest_phone, guest_email, appointment_date, appointment_time, duration_minutes, status, source, notes, created_at, services(name_uk), doctors(first_name,last_name)'

/** GET /api/appointments — admin-only list */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const supabase = await createSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
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

    const adminAccess = await getAdminAccess(supabase, user.id)
    if (!adminAccess) {
      return NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      )
    }

    const { searchParams } = request.nextUrl
    const { page, pageSize, from, to } = parsePagination(searchParams)

    let query = supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT, { count: 'exact' })

    const status = searchParams.get('status')
    if (status) query = query.eq('status', status)

    const date = searchParams.get('date')
    if (date) query = query.eq('appointment_date', date)

    const doctorId = searchParams.get('doctorId')
    if (doctorId) query = query.eq('doctor_id', doctorId)

    const patientId = searchParams.get('patientId')
    if (patientId) query = query.eq('patient_id', patientId)

    const { data, error, count } = await query
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Не вдалося завантажити записи' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      meta: paginationMeta(page, pageSize, count),
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

/** POST /api/appointments — public booking */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let body: Partial<BookingPayload>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (!isBookingPayload(body)) {
    return NextResponse.json(
      { success: false, error: 'Відсутні обовʼязкові поля' },
      { status: 400 }
    )
  }

  if (!body.preferredDate?.trim() || !body.preferredTime?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Дата та час є обовʼязковими' },
      { status: 400 }
    )
  }

  return createSupabaseAppointment(body)
}
