import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Terminal mocks for the treatment_records chains the handlers use:
//  POST: insert(...).select('id').single()  and  select(FULL).eq('id').single()
//  GET:  select(LIST,{count}).eq(...).eq(...).order(...).range(...)
const mockGetUser = vi.fn()
const mockTrInsertSingle = vi.fn()
const mockTrFetchSingle = vi.fn()
const mockRange = vi.fn() // GET list terminal
const mockEq = vi.fn() // spy on every .eq(col, val) so tests can assert filters

vi.mock('@/lib/supabase/server', () => {
  // Chainable builder covering both the POST final-fetch (select→eq→single)
  // and the GET list (select→eq→eq→order→range).
  const builder = () => {
    const qb: Record<string, unknown> = {}
    qb.eq = (col: string, val: unknown) => {
      mockEq(col, val)
      return qb
    }
    qb.order = () => qb
    qb.range = (...a: unknown[]) => mockRange(...a)
    qb.single = () => mockTrFetchSingle()
    return qb
  }
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'treatment_records') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({ single: mockTrInsertSingle })),
            })),
            select: vi.fn(() => builder()),
          }
        }
        if (table === 'treatment_record_items') {
          return { insert: vi.fn(async () => ({ error: null })) }
        }
        return {}
      }),
    })),
  }
})

const mockGetAdminAccess = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getAdminAccess: (...args: unknown[]) => mockGetAdminAccess(...args),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19 })),
  rateLimitResponse: vi.fn(),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
}))

vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))

import { GET, POST } from '../../../app/api/treatment-records/route'

const PATIENT_ID = '5d2e7b1a-9f60-4c1e-b1de-2f2f4b7e8a11'
const APPT_ID = 'eeeeeeee-0000-4000-8000-000000000005'
const SERVICE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
const DOCTOR_A = 'aaaaaaaa-0000-4000-8000-000000000001'
const DOCTOR_B = 'bbbbbbbb-0000-4000-8000-000000000002'
const USER_ID = 'cccccccc-0000-4000-8000-000000000003'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/treatment-records', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    body: JSON.stringify(body),
  })
}

function signInAs(role: string | null, doctorId: string | null = null) {
  mockGetUser.mockResolvedValue({
    data: { user: role ? { id: USER_ID } : null },
    error: null,
  })
  mockGetAdminAccess.mockResolvedValue(
    role ? { id: USER_ID, role, doctorId } : null
  )
}

function validBody(doctorId: string) {
  return {
    patientId: PATIENT_ID,
    doctorId,
    items: [{ serviceId: SERVICE_ID, priceAtTime: 1000, quantity: 1 }],
  }
}

describe('POST /api/treatment-records — doctor ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrInsertSingle.mockResolvedValue({ data: { id: 'tr-1' }, error: null })
    mockTrFetchSingle.mockResolvedValue({
      data: { id: 'tr-1', doctor_id: DOCTOR_A },
      error: null,
    })
  })

  it('rejects unauthenticated requests', async () => {
    signInAs(null)
    const res = await POST(makeRequest(validBody(DOCTOR_A)))
    expect(res.status).toBe(401)
  })

  it('rejects a role without treatments:create (receptionist)', async () => {
    signInAs('receptionist')
    const res = await POST(makeRequest(validBody(DOCTOR_A)))
    expect(res.status).toBe(403)
  })

  it("rejects a doctor filing an act under another doctor's id (403)", async () => {
    signInAs('doctor', DOCTOR_A)
    const res = await POST(makeRequest(validBody(DOCTOR_B)))
    expect(res.status).toBe(403)
    // Ownership is enforced before any write.
    expect(mockTrInsertSingle).not.toHaveBeenCalled()
  })

  it('lets a doctor file an act under their own id (201)', async () => {
    signInAs('doctor', DOCTOR_A)
    const res = await POST(makeRequest(validBody(DOCTOR_A)))
    expect(res.status).toBe(201)
  })

  it('lets a non-doctor admin file an act for any doctor (ownership check n/a)', async () => {
    signInAs('admin', null)
    const res = await POST(makeRequest(validBody(DOCTOR_A)))
    expect(res.status).toBe(201)
  })
})

describe('GET /api/treatment-records — appointmentId filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 })
  })

  it('narrows the query by appointment_id and keeps doctor scope', async () => {
    signInAs('doctor', DOCTOR_A)
    const req = new NextRequest(
      `http://localhost:3000/api/treatment-records?appointmentId=${APPT_ID}`,
      { method: 'GET' }
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    // The new filter is applied server-side (locks in the perf fix that
    // replaced a fetch-the-whole-history-then-filter-client-side pattern)...
    expect(mockEq).toHaveBeenCalledWith('appointment_id', APPT_ID)
    // ...additively, on top of the doctor-scope filter (defense-in-depth).
    expect(mockEq).toHaveBeenCalledWith('doctor_id', DOCTOR_A)
  })

  it('does not apply the appointment filter when the param is absent', async () => {
    signInAs('doctor', DOCTOR_A)
    const req = new NextRequest('http://localhost:3000/api/treatment-records', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockEq).not.toHaveBeenCalledWith('appointment_id', expect.anything())
    expect(mockEq).toHaveBeenCalledWith('doctor_id', DOCTOR_A)
  })
})
