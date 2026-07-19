import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Terminal mocks for the two treatment_records chains the POST handler uses:
// insert(...).select('id').single()  and  select(FULL).eq('id').single().
const mockGetUser = vi.fn()
const mockTrInsertSingle = vi.fn()
const mockTrFetchSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'treatment_records') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ single: mockTrInsertSingle })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockTrFetchSingle })),
          })),
        }
      }
      if (table === 'treatment_record_items') {
        return { insert: vi.fn(async () => ({ error: null })) }
      }
      return {}
    }),
  })),
}))

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

import { POST } from '../../../app/api/treatment-records/route'

const PATIENT_ID = '5d2e7b1a-9f60-4c1e-b1de-2f2f4b7e8a11'
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
