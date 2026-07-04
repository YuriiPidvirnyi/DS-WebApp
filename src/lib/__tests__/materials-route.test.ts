import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mutable test doubles ────────────────────────────────────────────────────
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

import { GET, POST } from '../../../app/api/materials/route'
import { checkRateLimit, validateCSRF } from '@/lib/api-security'

// ─── Chainable Supabase query stub ───────────────────────────────────────────
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
  return new NextRequest('http://localhost:3000/api/materials', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 29 })
  vi.mocked(validateCSRF).mockReturnValue(true)
  mockGetAdminAccess.mockResolvedValue({ role: 'admin', doctorId: null })
  supabaseValue = makeSupabase({
    materials: {
      data: [
        {
          id: 'm1',
          name_uk: 'Композит',
          category: 'composite',
          unit: 'шт',
          material_inventory: [
            { current_quantity: 5 },
            { current_quantity: 3 },
          ],
        },
      ],
      error: null,
      count: 1,
    },
  })
})

describe('GET /api/materials', () => {
  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
    })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(429)
  })

  it('returns 503 when Supabase is unavailable', async () => {
    supabaseValue = null
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(503)
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseValue = makeSupabase({}, null)
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when not an admin member', async () => {
    mockGetAdminAccess.mockResolvedValue(null)
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(403)
  })

  it('returns 403 when the role lacks inventory:view', async () => {
    mockGetAdminAccess.mockResolvedValue({
      role: 'receptionist',
      doctorId: null,
    })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(403)
  })

  it('returns materials with summed inventory quantity', async () => {
    const res = await GET(makeRequest('GET'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data[0].current_quantity).toBe(8) // 5 + 3
    expect(body.meta.total).toBe(1)
  })

  it('returns 500 on a Supabase query error', async () => {
    supabaseValue = makeSupabase({
      materials: { data: null, error: { message: 'boom' }, count: null },
    })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/materials', () => {
  it('rejects invalid CSRF with 403', async () => {
    vi.mocked(validateCSRF).mockReturnValue(false)
    const res = await POST(makeRequest('POST', {}))
    expect(res.status).toBe(403)
  })

  it('returns 403 when the role lacks inventory:edit', async () => {
    mockGetAdminAccess.mockResolvedValue({
      role: 'receptionist',
      doctorId: null,
    })
    const res = await POST(
      makeRequest('POST', { nameUk: 'X', category: 'composite', unit: 'шт' })
    )
    expect(res.status).toBe(403)
  })

  it('validates required fields (nameUk, category, unit)', async () => {
    const res = await POST(makeRequest('POST', { nameUk: 'Only name' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('rejects a negative minStockLevel', async () => {
    const res = await POST(
      makeRequest('POST', {
        nameUk: 'X',
        category: 'composite',
        unit: 'шт',
        minStockLevel: -1,
      })
    )
    expect(res.status).toBe(400)
  })

  it('creates a material and seeds inventory at zero', async () => {
    supabaseValue = makeSupabase({
      materials: {
        data: {
          id: 'm-new',
          name_uk: 'Новий',
          category: 'composite',
          unit: 'шт',
        },
        error: null,
      },
      material_inventory: { error: null },
    })
    const res = await POST(
      makeRequest('POST', {
        nameUk: 'Новий',
        category: 'composite',
        unit: 'шт',
      })
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.current_quantity).toBe(0)
    expect(body.data.id).toBe('m-new')
  })
})
