import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 59 })),
  rateLimitResponse: vi.fn(),
}))

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { GET } from '../../../app/api/doctors/route'

function makeRequest(url = 'http://localhost:3000/api/doctors') {
  return new NextRequest(url)
}

describe('GET /api/doctors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns formatted doctor list', async () => {
    const doctors = [
      {
        id: '1',
        first_name: 'Олена',
        last_name: 'Коваленко',
        patronymic: 'Петрівна',
        specialization: 'Терапевт',
        experience_years: 12,
        education: 'НМУ',
        bio: 'test',
        photo_url: null,
      },
    ]

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: doctors, error: null }),
      }),
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].fullName).toBe('Коваленко Олена Петрівна')
    expect(body.data[0].specialization).toBe('Терапевт')
  })

  it('returns 503 when Supabase is unavailable', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce(null as never)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.success).toBe(false)
  })

  it('returns 500 on Supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'db error' } }),
      }),
    })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
