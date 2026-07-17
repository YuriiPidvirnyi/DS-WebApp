import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSingle = vi.fn(async () => ({
  data: { id: '5d2e7b1a-9f60-4c1e-b1de-2f2f4b7e8a11' },
  error: null,
}))
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockGetUser = vi.fn(async () => ({ data: { user: null }, error: null }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'patient_intake_forms') {
        return { insert: mockInsert }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
  rateLimitResponse: vi.fn(),
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

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { POST } from '../../../app/api/intake/route'
import { validateCSRF } from '@/lib/api-security'

const validBody = {
  firstName: 'Тарас',
  lastName: 'Шевченко',
  phone: '+380671234567',
  dataConsent: true,
}

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/intake', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

describe('POST /api/intake', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects when CSRF is invalid', async () => {
    vi.mocked(validateCSRF).mockReturnValueOnce(false)

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(403)
  })

  it('rejects when data consent is missing', async () => {
    const res = await POST(makeRequest({ ...validBody, dataConsent: false }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects invalid phone format', async () => {
    const res = await POST(makeRequest({ ...validBody, phone: '0671234567' }))

    expect(res.status).toBe(400)
  })

  it('rejects promo codes with unexpected characters', async () => {
    const res = await POST(
      makeRequest({ ...validBody, promoCode: 'WELCOME 26!' })
    )

    expect(res.status).toBe(400)
  })

  it('creates a guest intake with normalized fields', async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        patronymic: '',
        email: '',
        dateOfBirth: '1990-05-10',
        allergies: '  лідокаїн  ',
        pregnancy: 'yes',
        promoCode: 'WELCOME',
        source: 'flyer',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBeTruthy()

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: null,
        first_name: 'Тарас',
        last_name: 'Шевченко',
        patronymic: null,
        email: null,
        phone: '+380671234567',
        date_of_birth: '1990-05-10',
        allergies: 'лідокаїн',
        is_pregnant: true,
        data_consent: true,
        marketing_consent: false,
        promo_code: 'WELCOME',
        source: 'flyer',
      })
    )
  })

  it('defaults source to direct and pregnancy to null', async () => {
    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'direct',
        is_pregnant: null,
        promo_code: null,
      })
    )
  })

  it('links the intake to the signed-in patient', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7' },
      } as never,
      error: null,
    })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      })
    )
  })
})
