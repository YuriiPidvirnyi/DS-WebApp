import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots, CliniCardsError } from '@/lib/clinicards-client'
import { getCachedData, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/appointments/slots?date=YYYY-MM-DD&doctorId= */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const date = searchParams.get('date')
  const doctorId = searchParams.get('doctorId') ?? ''

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Параметр date є обов\'язковим' },
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
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }
    console.error('[appointments/slots] unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
