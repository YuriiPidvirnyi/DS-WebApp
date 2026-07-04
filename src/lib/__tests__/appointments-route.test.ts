import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let supabaseValue: unknown = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabaseValue),
}))

const mockGetAdminAccess = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getAdminAccess: (...args: unknown[]) => mockGetAdminAccess(...args),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 14 })),
  rateLimitResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'rate' }), { status: 429 })
  ),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
  verifyTurnstileServer: vi.fn(async () => ({ valid: true })),
  turnstileInvalidResponse: vi.fn(
    () =>
      new Response(JSON.stringify({ success: false, error: 'CAPTCHA' }), {
        status: 400,
      })
  ),
}))

vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))
vi.mock('@/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { GET, POST } from '../../../app/api/appointments/route'
import {
  checkRateLimit,
  validateCSRF,
  verifyTurnstileServer,
} from '@/lib/api-security'

function makeQuery(result: unknown) {
  const b: Record<string, unknown> = {}
  const chain = () => b
  Object.assign(b, {
    select: chain,
    insert: chain,
    update: chain,
    delete: chain,
    eq: chain,
    or: chain,
    order: chain,
    limit: chain,
    range: chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(result).then(res, rej),
  })
  return b
}

function makeSupabase(
  resultsByTable: Record<string, unknown> = {},
  user: unknown = { id: 'user-1' }
) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
    from: vi.fn((table: string) =>
      makeQuery(resultsByTable[table] ?? { data: [], error: null, count: 0 })
    ),
  }
}

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/appointments', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const validBooking = {
  name: 'Іван Петренко',
  phone: '+380501234567',
  service: 'Терапія',
  preferredDate: '2099-01-01',
  preferredTime: '10:00',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 14 })
  vi.mocked(validateCSRF).mockReturnValue(true)
  vi.mocked(verifyTurnstileServer).mockResolvedValue({ valid: true })
  mockGetAdminAccess.mockResolvedValue({ role: 'admin', doctorId: null })
  supabaseValue = makeSupabase({
    appointments: { data: [{ id: 'a1' }], error: null, count: 1 },
    services: { data: null, error: null },
  })
})

describe('GET /api/appointments (admin list)', () => {
  it('returns 401 when unauthenticated', async () => {
    supabaseValue = makeSupabase({}, null)
    expect((await GET(makeRequest('GET'))).status).toBe(401)
  })

  it('returns 403 when not an admin member', async () => {
    mockGetAdminAccess.mockResolvedValue(null)
    expect((await GET(makeRequest('GET'))).status).toBe(403)
  })

  it('returns 403 when the role cannot view appointments', async () => {
    mockGetAdminAccess.mockResolvedValue({
      role: 'inventory_manager',
      doctorId: null,
    })
    expect((await GET(makeRequest('GET'))).status).toBe(403)
  })

  it('returns 403 when a doctor is not linked to a doctor record', async () => {
    mockGetAdminAccess.mockResolvedValue({ role: 'doctor', doctorId: null })
    expect((await GET(makeRequest('GET'))).status).toBe(403)
  })

  it('lists appointments for an admin', async () => {
    const res = await GET(makeRequest('GET'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/appointments (public booking)', () => {
  it('rejects invalid CSRF with 403', async () => {
    vi.mocked(validateCSRF).mockReturnValue(false)
    expect((await POST(makeRequest('POST', validBooking))).status).toBe(403)
  })

  it('rejects when Turnstile verification fails', async () => {
    vi.mocked(verifyTurnstileServer).mockResolvedValue({ valid: false })
    expect((await POST(makeRequest('POST', validBooking))).status).toBe(400)
  })

  it('rejects an invalid phone number', async () => {
    const res = await POST(
      makeRequest('POST', { ...validBooking, phone: '12345' })
    )
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('rejects a past preferredDate', async () => {
    const res = await POST(
      makeRequest('POST', { ...validBooking, preferredDate: '2000-01-01' })
    )
    expect(res.status).toBe(400)
  })

  it('creates a pending appointment (201)', async () => {
    supabaseValue = makeSupabase({
      appointments: { error: null },
      services: { data: null, error: null },
    })
    const res = await POST(makeRequest('POST', validBooking))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('pending')
    expect(body.data.name).toBe('Іван Петренко')
  })

  it('returns 503 when Supabase is unavailable', async () => {
    supabaseValue = null
    expect((await POST(makeRequest('POST', validBooking))).status).toBe(503)
  })
})
