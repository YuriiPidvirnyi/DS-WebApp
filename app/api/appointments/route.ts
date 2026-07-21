import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasAnyPermission } from '@/lib/permissions'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
  verifyTurnstileServer,
  turnstileInvalidResponse,
} from '@/lib/api-security'
import { parsePagination, paginationMeta } from '@/lib/pagination'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PHONE_REGEX = /^\+380\d{9}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const bookingSchema = z.object({
  name: z
    .string()
    .min(2, 'Імʼя занадто коротке')
    .max(100, 'Імʼя занадто довге'),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Невірний формат телефону (+380XXXXXXXXX)'),
  email: z
    .string()
    .optional()
    .transform(v => v ?? '')
    .refine(
      v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Невірний формат email'
    ),
  service: z
    .string()
    .min(1, 'Послуга обовʼязкова')
    .max(200, 'Назва послуги занадто довга'),
  message: z.string().max(2000, 'Повідомлення занадто довге').optional(),
  preferredDate: z
    .string()
    .regex(ISO_DATE_REGEX, 'Дата повинна бути у форматі YYYY-MM-DD')
    .refine(date => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(date) >= today
    }, 'Дата не може бути в минулому'),
  preferredTime: z.string().regex(TIME_REGEX, 'Невірний формат часу (HH:MM)'),
  doctorId: z
    .union([z.string().uuid('doctorId повинен бути UUID'), z.literal('')])
    .optional()
    .transform(v => v ?? ''),
  locale: z.enum(['uk', 'en', 'pl']).optional().default('uk'),
})

type BookingPayload = z.infer<typeof bookingSchema>

async function createSupabaseAppointment(payload: BookingPayload) {
  const supabase = await createSupabaseClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  // Active-doctor existence check
  const trimmedDoctorId = payload.doctorId?.trim() || null
  if (trimmedDoctorId) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', trimmedDoctorId)
      .eq('is_active', true)
      .maybeSingle()

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found or inactive' },
        { status: 400 }
      )
    }
  }

  const [
    {
      data: { user },
    },
    { data: serviceRecord },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('services')
      .select('id, price_uah')
      .eq('name_uk', payload.service)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const appointmentId = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const { error } = await supabase.from('appointments').insert({
    id: appointmentId,
    patient_id: user?.id ?? null,
    service_id: serviceRecord?.id ?? null,
    doctor_id: trimmedDoctorId,
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

  // Look up payment config for the service (per-service first, then global default)
  let paymentConfig: { mode: string; amountKopecks: number } | null = null
  if (serviceRecord?.id) {
    const { data: config } = await supabase
      .from('payment_configs')
      .select('payment_mode, deposit_percent')
      .or(`service_id.eq.${serviceRecord.id},service_id.is.null`)
      .order('service_id', { ascending: false, nullsFirst: false }) // prefer service-specific over global default
      .limit(1)
      .maybeSingle()

    if (config && config.payment_mode !== 'none') {
      const priceUah = Number(serviceRecord.price_uah ?? 0)
      if (priceUah > 0) {
        const fullKopecks = Math.round(priceUah * 100)
        const amountKopecks =
          config.payment_mode === 'deposit' && config.deposit_percent
            ? Math.round((fullKopecks * config.deposit_percent) / 100)
            : fullKopecks
        paymentConfig = { mode: config.payment_mode, amountKopecks }
      }
    }
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
        details: { source: 'webapp', locale: payload.locale },
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
    void Promise.resolve(
      supabase.from('notification_events').insert(notifEvents)
    )
      .then(({ error: notifErr }) => {
        if (notifErr)
          logger.warn('[appointments] Failed to queue notifications:', {
            data: notifErr.message,
          })
      })
      .catch((err: unknown) =>
        logger.error('Failed to queue notification:', { data: err })
      )
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
        paymentConfig,
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

    if (
      !hasAnyPermission(adminAccess.role, [
        'appointments:view_all',
        'appointments:view_own',
      ])
    ) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
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

    // Doctors see only their own appointments — enforce via server-side filter
    if (adminAccess.role === 'doctor') {
      if (!adminAccess.doctorId) {
        return NextResponse.json(
          { success: false, error: "Лікар не прив'язаний до запису в системі" },
          { status: 403 }
        )
      }
      query = query.eq('doctor_id', adminAccess.doctorId)
    } else {
      const doctorId = searchParams.get('doctorId')
      if (doctorId) query = query.eq('doctor_id', doctorId)
    }

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

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const cfToken = (rawBody as Record<string, unknown>).cf_turnstile_response as
    string | undefined
  const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
  if (!botOk) return turnstileInvalidResponse()

  const parsed = bookingSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return NextResponse.json(
      {
        success: false,
        error: firstError?.message ?? 'Відсутні обовʼязкові поля',
      },
      { status: 400 }
    )
  }

  return createSupabaseAppointment(parsed.data)
}
