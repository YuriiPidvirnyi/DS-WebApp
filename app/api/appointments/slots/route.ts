import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CLINIC_TZ = 'Europe/Kyiv'
const ACTIVE_STATUSES = ['pending', 'confirmed']
const DEFAULT_DURATION_MINUTES = 60

function buildScheduleGrid(date: string): string[] {
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

/** Current date (YYYY-MM-DD) and time (HH:MM) in the clinic's timezone. */
function clinicNow(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

type BookedRow = {
  appointment_time: string
  duration_minutes: number | null
  doctor_id: string | null
}

/**
 * Count how many bookings overlap each grid slot. A booking blocks every
 * hourly slot that intersects [start, start + duration).
 */
function countOverlaps(
  grid: string[],
  booked: BookedRow[]
): Map<string, number> {
  const counts = new Map<string, number>(grid.map(slot => [slot, 0]))
  for (const row of booked) {
    const start = toMinutes(row.appointment_time.slice(0, 5))
    const end = start + (row.duration_minutes || DEFAULT_DURATION_MINUTES)
    for (const slot of grid) {
      const slotStart = toMinutes(slot)
      if (slotStart < end && start < slotStart + 60) {
        counts.set(slot, (counts.get(slot) ?? 0) + 1)
      }
    }
  }
  return counts
}

/** GET /api/appointments/slots?date=YYYY-MM-DD&doctorId= */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  const doctorId = searchParams.get('doctorId')

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

  if (doctorId && !UUID_RE.test(doctorId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid doctorId format' },
      { status: 400 }
    )
  }

  const now = clinicNow()

  // Past date rejection
  if (date < now.date) {
    return NextResponse.json(
      { success: false, error: 'Cannot query slots for past dates' },
      { status: 400 }
    )
  }

  // Too far in the future (> 60 days)
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
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

  // Base working-hours grid; for today, drop slots that already started.
  let grid = buildScheduleGrid(date)
  if (date === now.date) {
    grid = grid.filter(slot => slot > now.time)
  }

  if (grid.length === 0) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const supabase = getServiceClient()
    // Without a service client (e.g. local dev without env vars) fall back
    // to the static grid rather than blocking the booking flow entirely.
    if (supabase) {
      let query = supabase
        .from('appointments')
        .select('appointment_time, duration_minutes, doctor_id')
        .eq('appointment_date', date)
        .in('status', ACTIVE_STATUSES)
      if (doctorId) query = query.eq('doctor_id', doctorId)

      const { data: booked, error } = await query
      if (error) throw error

      const counts = countOverlaps(grid, (booked ?? []) as BookedRow[])

      if (doctorId) {
        // Specific doctor: any overlapping booking blocks the slot.
        grid = grid.filter(slot => (counts.get(slot) ?? 0) === 0)
      } else {
        // "Any doctor": a slot is gone only when every active doctor is busy.
        const { count: doctorCount } = await supabase
          .from('doctors')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
        const capacity = Math.max(doctorCount ?? 1, 1)
        grid = grid.filter(slot => (counts.get(slot) ?? 0) < capacity)
      }
    }

    const response = NextResponse.json({ success: true, data: grid })
    // Availability is dynamic — keep the shared cache window short.
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    )
    return response
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    // Degrade to the static grid so the booking form keeps working.
    return NextResponse.json({ success: true, data: grid })
  }
}
