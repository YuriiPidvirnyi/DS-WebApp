import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// treatment_records chains the PATCH handler uses:
//  - ownership fetch:  .select('doctor_id').eq('id').maybeSingle()
//  - update:           .update(...).eq('id')            (awaited → {error})
//  - final fetch:      .select(FULL).eq('id').maybeSingle()
const mockGetUser = vi.fn()
const mockOwnerMaybeSingle = vi.fn()
const mockFullMaybeSingle = vi.fn()
const mockUpdateEq = vi.fn(async () => ({ error: null }))
const mockDeleteEq = vi.fn(async () => ({ error: null }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'treatment_records') {
        return {
          select: vi.fn((cols: string) => ({
            eq: vi.fn(() => ({
              maybeSingle:
                cols === 'doctor_id'
                  ? mockOwnerMaybeSingle
                  : mockFullMaybeSingle,
            })),
          })),
          update: vi.fn(() => ({ eq: mockUpdateEq })),
          delete: vi.fn(() => ({ eq: mockDeleteEq })),
        }
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

// V2 off → the completed-status writeoff hook / prevStatus fetch never runs.
vi.mock('@/lib/stock-helpers', () => ({
  isV2On: vi.fn(() => false),
  getClinicSetting: vi.fn(async () => null),
  resolveDoctorCabinetWarehouse: vi.fn(async () => null),
}))

vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))

import { PATCH, DELETE } from '../../../app/api/treatment-records/[id]/route'

const DOCTOR_A = 'aaaaaaaa-0000-4000-8000-000000000001'
const DOCTOR_B = 'bbbbbbbb-0000-4000-8000-000000000002'
const USER_ID = 'cccccccc-0000-4000-8000-000000000003'
const REC_ID = 'dddddddd-0000-4000-8000-000000000004'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost:3000/api/treatment-records/${REC_ID}`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'a'.repeat(32),
      },
      body: JSON.stringify(body),
    }
  )
}

function delRequest() {
  return new NextRequest(
    `http://localhost:3000/api/treatment-records/${REC_ID}`,
    { method: 'DELETE', headers: { 'x-csrf-token': 'a'.repeat(32) } }
  )
}

const params = { params: Promise.resolve({ id: REC_ID }) }

function signInAs(role: string | null, doctorId: string | null = null) {
  mockGetUser.mockResolvedValue({
    data: { user: role ? { id: USER_ID } : null },
    error: null,
  })
  mockGetAdminAccess.mockResolvedValue(
    role ? { id: USER_ID, role, doctorId } : null
  )
}

describe('PATCH /api/treatment-records/[id] — sign gate & ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateEq.mockResolvedValue({ error: null })
    mockOwnerMaybeSingle.mockResolvedValue({
      data: { doctor_id: DOCTOR_A },
      error: null,
    })
    mockFullMaybeSingle.mockResolvedValue({
      data: { id: REC_ID, doctor_id: DOCTOR_A, status: 'signed' },
      error: null,
    })
  })

  it('rejects unauthenticated requests', async () => {
    signInAs(null)
    const res = await PATCH(makeRequest({ status: 'signed' }), params)
    expect(res.status).toBe(401)
  })

  it('blocks an edit_draft-only role (assistant) from finalizing via PATCH', async () => {
    // assistant has treatments:edit_draft but NOT treatments:sign
    signInAs('assistant')
    const res = await PATCH(makeRequest({ status: 'signed' }), params)
    expect(res.status).toBe(403)
    // Blocked before any write.
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it("blocks a doctor from editing another doctor's act (ownership)", async () => {
    signInAs('doctor', DOCTOR_B) // caller is doctor B
    mockOwnerMaybeSingle.mockResolvedValue({
      data: { doctor_id: DOCTOR_A }, // record belongs to doctor A
      error: null,
    })
    const res = await PATCH(makeRequest({ status: 'signed' }), params)
    expect(res.status).toBe(403)
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('lets a doctor sign their own act (200)', async () => {
    signInAs('doctor', DOCTOR_A)
    const res = await PATCH(makeRequest({ status: 'signed' }), params)
    expect(res.status).toBe(200)
    expect(mockUpdateEq).toHaveBeenCalled()
  })
})

describe('PATCH /api/treatment-records/[id] — status state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateEq.mockResolvedValue({ error: null })
    mockOwnerMaybeSingle.mockResolvedValue({
      data: { doctor_id: DOCTOR_A },
      error: null,
    })
  })

  it('rejects skipping a step: draft → completed (409)', async () => {
    signInAs('doctor', DOCTOR_A) // has treatments:sign
    mockFullMaybeSingle.mockResolvedValue({
      data: { id: REC_ID, doctor_id: DOCTOR_A, status: 'draft' },
      error: null,
    })
    const res = await PATCH(makeRequest({ status: 'completed' }), params)
    expect(res.status).toBe(409)
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('rejects reversing: completed → draft (409)', async () => {
    signInAs('doctor', DOCTOR_A)
    mockFullMaybeSingle.mockResolvedValue({
      data: { id: REC_ID, doctor_id: DOCTOR_A, status: 'completed' },
      error: null,
    })
    const res = await PATCH(makeRequest({ status: 'draft' }), params)
    expect(res.status).toBe(409)
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('rejects an unknown status (400)', async () => {
    signInAs('doctor', DOCTOR_A)
    const res = await PATCH(makeRequest({ status: 'archived' }), params)
    expect(res.status).toBe(400)
    expect(mockUpdateEq).not.toHaveBeenCalled()
  })

  it('allows the valid step draft → signed (200)', async () => {
    signInAs('doctor', DOCTOR_A)
    mockFullMaybeSingle.mockResolvedValue({
      data: { id: REC_ID, doctor_id: DOCTOR_A, status: 'draft' },
      error: null,
    })
    const res = await PATCH(makeRequest({ status: 'signed' }), params)
    expect(res.status).toBe(200)
    expect(mockUpdateEq).toHaveBeenCalled()
  })
})

describe('DELETE /api/treatment-records/[id] — ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteEq.mockResolvedValue({ error: null })
    mockOwnerMaybeSingle.mockResolvedValue({
      data: { doctor_id: DOCTOR_A },
      error: null,
    })
  })

  it('rejects unauthenticated requests', async () => {
    signInAs(null)
    const res = await DELETE(delRequest(), params)
    expect(res.status).toBe(401)
  })

  it("blocks a doctor deleting another doctor's act (403)", async () => {
    signInAs('doctor', DOCTOR_B) // record belongs to doctor A
    const res = await DELETE(delRequest(), params)
    expect(res.status).toBe(403)
    expect(mockDeleteEq).not.toHaveBeenCalled()
  })

  it('lets a doctor delete their own act (200)', async () => {
    signInAs('doctor', DOCTOR_A)
    const res = await DELETE(delRequest(), params)
    expect(res.status).toBe(200)
    expect(mockDeleteEq).toHaveBeenCalled()
  })
})
