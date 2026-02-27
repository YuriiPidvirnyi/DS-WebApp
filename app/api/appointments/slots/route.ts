import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots, CliniCardsError } from '@/lib/clinicards-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Revalidation period for slot data (5 minutes)
export const revalidate = 300

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
    const data = await getAvailableSlots(doctorId, date)
    
    // Add cache headers for slot data (short cache, as slots change frequently)
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
