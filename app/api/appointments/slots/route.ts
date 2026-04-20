import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Параметр date є обов'язковим" },
      { status: 400 }
    )
  }

  // ISO date format
  if (!ISO_DATE_RE.test(date)) {
    return NextResponse.json(
      { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const now = Date.now()
  const today = new Date(now).toISOString().slice(0, 10)

  // Past date rejection
  if (date < today) {
    return NextResponse.json(
      { success: false, error: 'Cannot query slots for past dates' },
      { status: 400 }
    )
  }

  // Too far in the future (> 60 days)
  const maxDate = new Date(now + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  if (date > maxDate) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cannot query slots more than 60 days in advance',
      },
      { status: 400 }
    )
  }

  try {
    const response = NextResponse.json({
      success: true,
      data: buildFallbackSlots(date),
    })
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    return response
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      success: true,
      data: buildFallbackSlots(date),
    })
  }
}
