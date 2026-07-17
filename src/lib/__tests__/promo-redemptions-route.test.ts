import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockIntakeMaybeSingle = vi.fn()
const mockRedemptionSingle = vi.fn()
const mockRedemptionInsert = vi.fn(() => ({
  select: vi.fn(() => ({ single: mockRedemptionSingle })),
}))
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'patient_intake_forms') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockIntakeMaybeSingle })),
          })),
        }
      }
      if (table === 'promo_redemptions') {
        return { insert: mockRedemptionInsert }
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

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { POST } from '../../../app/api/promo/redemptions/route'

const INTAKE_ID = '5d2e7b1a-9f60-4c1e-b1de-2f2f4b7e8a11'
const STAFF_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/promo/redemptions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    body: JSON.stringify(body),
  })
}

function signInAs(role: string | null) {
  mockGetUser.mockResolvedValue({
    data: { user: role ? { id: STAFF_ID } : null },
    error: null,
  })
  mockGetAdminAccess.mockResolvedValue(role ? { id: STAFF_ID, role } : null)
}

describe('POST /api/promo/redemptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIntakeMaybeSingle.mockResolvedValue({
      data: { id: INTAKE_ID, patient_id: null },
      error: null,
    })
    mockRedemptionSingle.mockResolvedValue({
      data: { id: 'red-1', redeemed_at: '2026-07-17T09:00:00Z' },
      error: null,
    })
  })

  it('rejects unauthenticated requests', async () => {
    signInAs(null)

    const res = await POST(makeRequest({ intakeFormId: INTAKE_ID }))
    expect(res.status).toBe(401)
  })

  it('rejects roles without promo:redeem (e.g. analyst)', async () => {
    signInAs('analyst')

    const res = await POST(makeRequest({ intakeFormId: INTAKE_ID }))
    expect(res.status).toBe(403)
    expect(mockRedemptionInsert).not.toHaveBeenCalled()
  })

  it('allows receptionist to record a redemption', async () => {
    signInAs('receptionist')

    const res = await POST(makeRequest({ intakeFormId: INTAKE_ID }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.id).toBe('red-1')
    expect(mockRedemptionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        campaign_slug: 'welcome_pack',
        intake_form_id: INTAKE_ID,
        redeemed_by: STAFF_ID,
      })
    )
  })

  it('rejects an invalid intake id', async () => {
    signInAs('receptionist')

    const res = await POST(makeRequest({ intakeFormId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when the intake form does not exist', async () => {
    signInAs('receptionist')
    mockIntakeMaybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await POST(makeRequest({ intakeFormId: INTAKE_ID }))
    expect(res.status).toBe(404)
  })

  it('returns 409 when the gift was already given (unique violation)', async () => {
    signInAs('receptionist')
    mockRedemptionSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value' },
    })

    const res = await POST(makeRequest({ intakeFormId: INTAKE_ID }))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('already_redeemed')
  })
})
