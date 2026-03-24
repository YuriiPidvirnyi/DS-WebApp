import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots, CliniCardsError } from '@/lib/clinicards-client'
import { getCachedData, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let hasLoggedMissingCliniCardsConfig = false

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function buildFallbackSlots(date: string): string[] {
  const day = new Date(`${date}T00:00:00`).getDay()

  // Sunday
  if (day === 0) return []

  // Saturday
  if (day === 6) {
    return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
  }

  // Weekdays
  return [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ]
}

/** GET /api/appointments/slots?date=YYYY-MM-DD&doctorId= */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date')
  const doctorId = searchParams.get('doctorId') ?? ''

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Параметр date є обов'язковим" },
      { status: 400 }
    )
  }

  // ISO date format
  if (!ISO_DATE_RE.test(date)) {
    return NextResponse.json(
      { success: false, error: 'Дата у форматі YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const requestedDate = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Past date rejection
  if (requestedDate < today) {
    return NextResponse.json(
      { success: false, error: 'Неможливо переглянути слоти для минулої дати' },
      { status: 400 }
    )
  }

  // Too far in the future (> 60 days)
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 60)
  if (requestedDate > maxDate) {
    return NextResponse.json(
      { success: false, error: 'Дата перевищує горизонт бронювання (60 днів)' },
      { status: 400 }
    )
  }

  try {
    // Use Redis caching for slot data
    const cacheKey = `${CACHE_KEYS.SLOTS}:${doctorId}:${date}`
    const data = await getCachedData(
      cacheKey,
      () => getAvailableSlots(doctorId, date),
      CACHE_TTL.SLOTS
    )

    // Add cache headers for slot data
    const response = NextResponse.json({ success: true, data })
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    return response
  } catch (error) {
    if (error instanceof CliniCardsError) {
      if (error.code === 'MISSING_API_KEY') {
        if (!hasLoggedMissingCliniCardsConfig) {
          console.warn(
            '[appointments/slots] CLINICARDS_API_KEY is missing; using deterministic fallback slots.'
          )
          hasLoggedMissingCliniCardsConfig = true
        }
        return NextResponse.json({
          success: true,
          data: buildFallbackSlots(date),
          meta: { source: 'fallback', reason: 'clinicards_not_configured' },
        })
      }

      console.warn(
        '[appointments/slots] CliniCards unavailable, using fallback slots:',
        {
          status: error.status,
          code: error.code,
        }
      )
      return NextResponse.json({
        success: true,
        data: buildFallbackSlots(date),
        meta: { source: 'fallback', reason: 'clinicards_unavailable' },
      })
    }

    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      success: true,
      data: buildFallbackSlots(date),
      meta: { source: 'fallback', reason: 'unexpected_error' },
    })
  }
}
