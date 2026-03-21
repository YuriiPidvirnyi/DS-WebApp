import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointments,
  createAppointment,
  CliniCardsError,
  type AppointmentPayload,
} from '@/lib/clinicards-client'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'

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
}

function isBookingPayload(
  body: Partial<BookingPayload & AppointmentPayload>
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
    console.error('[appointments] Supabase create error:', error)
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити запис' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: appointmentId,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
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

function errorResponse(error: unknown) {
  if (error instanceof CliniCardsError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }
  console.error('[appointments] unexpected error:', error)
  return NextResponse.json(
    { success: false, error: 'Внутрішня помилка сервера' },
    { status: 500 }
  )
}

async function requireAdmin() {
  const supabase = await createSupabaseClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
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

  return null
}

/** GET /api/appointments?date=&doctorId=&patientId= */
export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute (no CSRF needed for GET)
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const authResponse = await requireAdmin()
  if (authResponse) return authResponse

  const { searchParams } = request.nextUrl
  const params: Record<string, string> = {}
  searchParams.forEach((v, k) => {
    params[k] = v
  })

  try {
    const data = await getAppointments(
      Object.keys(params).length ? params : undefined
    )
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** POST /api/appointments */
export async function POST(request: NextRequest) {
  // CSRF validation
  if (!validateCSRF(request)) return csrfErrorResponse()

  // Rate limiting: 15 requests per minute
  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let body: Partial<AppointmentPayload & BookingPayload>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  // Booking form payload (current UI) -> save to Supabase appointments.
  if (isBookingPayload(body)) {
    if (!body.preferredDate?.trim() || !body.preferredTime?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Дата та час є обовʼязковими' },
        { status: 400 }
      )
    }

    return createSupabaseAppointment(body)
  }

  // Legacy CliniCards payload validation
  const required: (keyof AppointmentPayload)[] = [
    'patientId',
    'doctorId',
    'date',
    'time',
    'duration',
  ]
  const missing = required.filter(f => !body[f])
  if (missing.length) {
    return NextResponse.json(
      { success: false, error: `Відсутні поля: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const data = await createAppointment(body as AppointmentPayload)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
