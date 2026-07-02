import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

let appointmentsResponse: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}
let doctorsCountResponse: { count: number | null } = { count: 1 }

function makeThenable(getResult: () => unknown) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.in = vi.fn(() => builder)
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(getResult()).then(resolve)
  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) =>
      table === 'appointments'
        ? makeThenable(() => appointmentsResponse)
        : makeThenable(() => doctorsCountResponse)
    ),
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 59 })),
  rateLimitResponse: vi.fn(),
}))

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { GET } from '../../../app/api/appointments/slots/route'

const DOCTOR_ID = '11111111-1111-1111-1111-111111111111'

function futureDateWithDay(predicate: (day: number) => boolean): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  while (!predicate(d.getDay())) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const weekday = () => futureDateWithDay(day => day >= 1 && day <= 5)
const sunday = () => futureDateWithDay(day => day === 0)

function makeRequest(query: string) {
  return new NextRequest(
    `http://localhost:3000/api/appointments/slots?${query}`
  )
}

describe('GET /api/appointments/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
    appointmentsResponse = { data: [], error: null }
    doctorsCountResponse = { count: 1 }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the full weekday grid when nothing is booked', async () => {
    const res = await GET(
      makeRequest(`date=${weekday()}&doctorId=${DOCTOR_ID}`)
    )
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toContain('09:00')
    expect(body.data).toHaveLength(9)
  })

  it('excludes slots already booked for the requested doctor', async () => {
    appointmentsResponse = {
      data: [
        {
          appointment_time: '10:00:00',
          duration_minutes: 60,
          doctor_id: DOCTOR_ID,
        },
      ],
      error: null,
    }

    const res = await GET(
      makeRequest(`date=${weekday()}&doctorId=${DOCTOR_ID}`)
    )
    const body = await res.json()

    expect(body.data).not.toContain('10:00')
    expect(body.data).toContain('09:00')
    expect(body.data).toContain('11:00')
  })

  it('blocks every grid slot a long appointment overlaps', async () => {
    appointmentsResponse = {
      data: [
        {
          appointment_time: '10:00:00',
          duration_minutes: 120,
          doctor_id: DOCTOR_ID,
        },
      ],
      error: null,
    }

    const res = await GET(
      makeRequest(`date=${weekday()}&doctorId=${DOCTOR_ID}`)
    )
    const body = await res.json()

    expect(body.data).not.toContain('10:00')
    expect(body.data).not.toContain('11:00')
    expect(body.data).toContain('12:00')
  })

  it('keeps a slot available for "any doctor" while capacity remains', async () => {
    doctorsCountResponse = { count: 2 }
    appointmentsResponse = {
      data: [
        {
          appointment_time: '10:00:00',
          duration_minutes: 60,
          doctor_id: DOCTOR_ID,
        },
      ],
      error: null,
    }

    const res = await GET(makeRequest(`date=${weekday()}`))
    const body = await res.json()

    expect(body.data).toContain('10:00')
  })

  it('removes a slot for "any doctor" when all doctors are busy', async () => {
    doctorsCountResponse = { count: 2 }
    appointmentsResponse = {
      data: [
        {
          appointment_time: '10:00:00',
          duration_minutes: 60,
          doctor_id: DOCTOR_ID,
        },
        {
          appointment_time: '10:00:00',
          duration_minutes: 60,
          doctor_id: '22222222-2222-2222-2222-222222222222',
        },
      ],
      error: null,
    }

    const res = await GET(makeRequest(`date=${weekday()}`))
    const body = await res.json()

    expect(body.data).not.toContain('10:00')
    expect(body.data).toContain('09:00')
  })

  it('returns an empty grid on Sunday', async () => {
    const res = await GET(makeRequest(`date=${sunday()}`))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('rejects a malformed doctorId', async () => {
    const res = await GET(makeRequest(`date=${weekday()}&doctorId=not-a-uuid`))
    expect(res.status).toBe(400)
  })

  it('falls back to the static grid when the service client is unavailable', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const res = await GET(makeRequest(`date=${weekday()}`))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(9)
  })

  it('degrades to the static grid when the availability query fails', async () => {
    appointmentsResponse = { data: null, error: new Error('db down') }

    const res = await GET(
      makeRequest(`date=${weekday()}&doctorId=${DOCTOR_ID}`)
    )
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(9)
  })
})
