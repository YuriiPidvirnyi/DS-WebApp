import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  CACHE_KEYS,
  CACHE_TTL,
  getCachedData,
  invalidateCache,
} from '@/lib/redis'
import { captureException } from '@/utils/sentry'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PeriodDays = 7 | 30 | 90
const PERIOD_OPTIONS: PeriodDays[] = [7, 30, 90]

interface AppointmentAnalyticsRow {
  appointment_date: string
  status: string
  price_uah: number | null
  source: string | null
  service_id: string | null
}

interface ServiceRow {
  id: string
  name_uk: string
}

interface AnalyticsModel {
  totalAppointments: number
  completedAppointments: number
  pendingAppointments: number
  cancelledAppointments: number
  completionRate: number
  revenue: number
  averageTicket: number
  totalPatients: number
  unreadContacts: number
  pendingReviews: number
  timeline: Array<{ date: string; count: number; revenue: number }>
  sourceBreakdown: Array<{ name: string; count: number }>
  topServices: Array<{ name: string; count: number }>
}

function normalizePeriodDays(value: unknown): PeriodDays {
  const parsed = Number(value)
  return PERIOD_OPTIONS.includes(parsed as PeriodDays)
    ? (parsed as PeriodDays)
    : 30
}

function analyticsCacheKey(periodDays: PeriodDays): string {
  return `${CACHE_KEYS.ANALYTICS}:${periodDays}`
}

function buildTimeline(
  periodDays: PeriodDays,
  appointments: AppointmentAnalyticsRow[]
): Array<{ date: string; count: number; revenue: number }> {
  const map = new Map<string, { count: number; revenue: number }>()
  const start = new Date()
  start.setDate(start.getDate() - (periodDays - 1))

  for (let i = 0; i < periodDays; i += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    const key = current.toISOString().slice(0, 10)
    map.set(key, { count: 0, revenue: 0 })
  }

  appointments.forEach(appointment => {
    const bucket = map.get(appointment.appointment_date)
    if (!bucket) return
    bucket.count += 1
    bucket.revenue += Number(appointment.price_uah || 0)
  })

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    revenue: data.revenue,
  }))
}

function buildTopServices(
  appointments: AppointmentAnalyticsRow[],
  services: ServiceRow[]
): Array<{ name: string; count: number }> {
  const serviceMap = new Map(
    services.map(service => [service.id, service.name_uk])
  )
  const counters = new Map<string, number>()

  appointments.forEach(appointment => {
    const name = appointment.service_id
      ? serviceMap.get(appointment.service_id) || 'Невідома послуга'
      : 'Без послуги'
    counters.set(name, (counters.get(name) || 0) + 1)
  })

  return Array.from(counters.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

async function requireAdmin(): Promise<
  { supabase: SupabaseClient } | { response: NextResponse }
> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase }
}

function settledData<T>(
  result: PromiseSettledResult<{ data: T[] | null; error: unknown }>,
  fallback: T[] = []
): T[] {
  return result.status === 'fulfilled'
    ? (result.value.data ?? fallback)
    : fallback
}

function settledCount(
  result: PromiseSettledResult<{ count: number | null; error: unknown }>
): number {
  return result.status === 'fulfilled' ? (result.value.count ?? 0) : 0
}

async function buildAnalyticsModel(
  supabase: SupabaseClient,
  periodDays: PeriodDays
): Promise<AnalyticsModel> {
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const fromDate = new Date(today)
  fromDate.setDate(today.getDate() - (periodDays - 1))
  const fromDateIso = fromDate.toISOString().slice(0, 10)

  const results = await Promise.allSettled([
    supabase
      .from('appointments')
      .select('appointment_date, status, price_uah, source, service_id')
      .gte('appointment_date', fromDateIso)
      .lte('appointment_date', todayIso),
    supabase.from('services').select('id, name_uk'),
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      captureException(
        r.reason instanceof Error ? r.reason : new Error(String(r.reason))
      )
      console.error(`[analytics] Query ${i} failed:`, r.reason)
    }
  })

  const appointments = settledData(results[0]) as AppointmentAnalyticsRow[]
  const services = settledData(results[1]) as ServiceRow[]
  const totalPatients = settledCount(results[2])
  const unreadContacts = settledCount(results[3])
  const pendingReviews = settledCount(results[4])

  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(
    appointment => appointment.status === 'completed'
  ).length
  const pendingAppointments = appointments.filter(
    appointment => appointment.status === 'pending'
  ).length
  const cancelledAppointments = appointments.filter(appointment =>
    ['cancelled', 'no_show'].includes(appointment.status)
  ).length
  const revenue = appointments.reduce(
    (sum, appointment) => sum + Number(appointment.price_uah || 0),
    0
  )

  const actionable = appointments.filter(
    a => a.status !== 'cancelled' && a.status !== 'no_show'
  )
  const completionRate =
    actionable.length > 0
      ? (actionable.filter(a => a.status === 'completed').length /
          actionable.length) *
        100
      : 0
  const averageTicket =
    completedAppointments > 0 ? revenue / completedAppointments : 0

  const sourceMap = new Map<string, number>()
  appointments.forEach(appointment => {
    const source = appointment.source || 'unknown'
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    cancelledAppointments,
    completionRate,
    revenue,
    averageTicket,
    totalPatients,
    unreadContacts,
    pendingReviews,
    timeline: buildTimeline(periodDays, appointments),
    sourceBreakdown,
    topServices: buildTopServices(appointments, services),
  }
}

export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 40, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const adminContext = await requireAdmin()
  if ('response' in adminContext) return adminContext.response

  const periodDays = normalizePeriodDays(
    request.nextUrl.searchParams.get('periodDays')
  )
  const cacheKey = analyticsCacheKey(periodDays)

  try {
    const model = await getCachedData(
      cacheKey,
      () => buildAnalyticsModel(adminContext.supabase, periodDays),
      CACHE_TTL.ANALYTICS
    )

    return NextResponse.json({
      success: true,
      data: model,
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити аналітику' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const adminContext = await requireAdmin()
  if ('response' in adminContext) return adminContext.response

  let body: { action?: string; periodDays?: number | string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (body.action !== 'refresh') {
    return NextResponse.json(
      { success: false, error: 'Підтримується лише action="refresh"' },
      { status: 400 }
    )
  }

  await Promise.all(
    PERIOD_OPTIONS.map(period => invalidateCache(analyticsCacheKey(period)))
  )

  const periodDays = normalizePeriodDays(body.periodDays)

  try {
    const refreshed = await buildAnalyticsModel(
      adminContext.supabase,
      periodDays
    )
    return NextResponse.json({
      success: true,
      data: refreshed,
      message: 'Аналітику оновлено',
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити аналітику' },
      { status: 500 }
    )
  }
}
