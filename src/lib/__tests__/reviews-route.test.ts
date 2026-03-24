import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockInsert = vi.fn()
const mockSelectChain = {
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        name: 'Test',
        rating: 5,
        service: 'Терапія',
        doctor: null,
        comment: 'Great',
        visit_date: null,
        would_recommend: true,
        created_at: '2026-01-01',
      },
    ],
    error: null,
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue(mockSelectChain),
          insert: mockInsert,
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 29 })),
  rateLimitResponse: vi.fn(),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
}))

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { GET, POST } from '../../../app/api/reviews/route'
import { validateCSRF } from '@/lib/api-security'

function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  url = 'http://localhost:3000/api/reviews'
) {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

describe('GET /api/reviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns approved reviews mapped to camelCase', async () => {
    const res = await GET(makeRequest('GET'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0]).toHaveProperty('wouldRecommend')
    expect(body.data.items[0]).toHaveProperty('createdAt')
  })
})

describe('POST /api/reviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects when CSRF is invalid', async () => {
    vi.mocked(validateCSRF).mockReturnValueOnce(false)

    const res = await POST(
      makeRequest('POST', {
        name: 'Test',
        rating: 5,
        service: 'Терапія',
        comment: 'Good',
      })
    )

    expect(res.status).toBe(403)
  })

  it('validates required fields', async () => {
    const res = await POST(makeRequest('POST', { name: 'Test', rating: 5 }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('validates rating range', async () => {
    const res = await POST(
      makeRequest('POST', {
        name: 'Test',
        service: 'Терапія',
        comment: 'Good',
        rating: 6,
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('creates review with status pending', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const res = await POST(
      makeRequest('POST', {
        name: 'Test User',
        rating: 5,
        service: 'Терапія',
        comment: 'Excellent service!',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.created).toBe(true)
  })
})
