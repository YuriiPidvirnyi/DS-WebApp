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
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 29 })),
  rateLimitResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'rate' }), { status: 429 })
  ),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
}))

vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))

import { GET, POST } from '../../../app/api/treatment-records/route'
import { checkRateLimit, validateCSRF } from '@/lib/api-security'

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
    rpc: vi.fn(async () => ({ error: null })),
  }
}

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/treatment-records', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const validCreateBody = {
  patientId: 'p1',
  doctorId: 'd1',
  items: [{ serviceId: 's1', priceAtTime: 500, quantity: 2 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 29 })
  vi.mocked(validateCSRF).mockReturnValue(true)
  mockGetAdminAccess.mockResolvedValue({ role: 'admin', doctorId: null })
  supabaseValue = makeSupabase({
    treatment_records: { data: [{ id: 't1' }], error: null, count: 1 },
  })
})

describe('GET /api/treatment-records', () => {
  it('returns 503 when Supabase is unavailable', async () => {
    supabaseValue = null
    expect((await GET(makeRequest('GET'))).status).toBe(503)
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseValue = makeSupabase({}, null)
    expect((await GET(makeRequest('GET'))).status).toBe(401)
  })

  it('returns 403 when not an admin member', async () => {
    mockGetAdminAccess.mockResolvedValue(null)
    expect((await GET(makeRequest('GET'))).status).toBe(403)
  })

  it('returns 403 when the role cannot view treatments', async () => {
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

  it('lists treatment records for an admin', async () => {
    const res = await GET(makeRequest('GET'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/treatment-records', () => {
  it('rejects invalid CSRF with 403', async () => {
    vi.mocked(validateCSRF).mockReturnValue(false)
    expect((await POST(makeRequest('POST', validCreateBody))).status).toBe(403)
  })

  it('returns 403 when the role lacks treatments:create', async () => {
    mockGetAdminAccess.mockResolvedValue({ role: 'assistant', doctorId: null })
    const res = await POST(makeRequest('POST', validCreateBody))
    expect(res.status).toBe(403)
  })

  it('rejects a body missing patientId/doctorId/items', async () => {
    const res = await POST(makeRequest('POST', { patientId: 'p1' }))
    expect(res.status).toBe(400)
  })

  it('rejects items without serviceId or priceAtTime', async () => {
    const res = await POST(
      makeRequest('POST', {
        patientId: 'p1',
        doctorId: 'd1',
        items: [{ toothNumber: '11' }],
      })
    )
    expect(res.status).toBe(400)
  })

  it('creates a treatment record and returns it (201)', async () => {
    supabaseValue = makeSupabase({
      treatment_records: {
        data: { id: 't-new', patient_id: 'p1', doctor_id: 'd1' },
        error: null,
      },
      treatment_record_items: { error: null },
    })
    const res = await POST(makeRequest('POST', validCreateBody))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('t-new')
  })
})
