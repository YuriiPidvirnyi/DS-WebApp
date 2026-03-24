import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({ insert: mockInsert })),
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19 })),
  rateLimitResponse: vi.fn(),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
}))

import { POST } from '../../../app/api/feedback/form/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/feedback/form', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/feedback/form', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires form field', async () => {
    const res = await POST(makeRequest({ rating: 'up' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('validates rating is up or down', async () => {
    const res = await POST(makeRequest({ form: 'booking', rating: 'maybe' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('rejects comments over 2000 chars', async () => {
    const res = await POST(
      makeRequest({
        form: 'booking',
        rating: 'up',
        comment: 'x'.repeat(2001),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('records valid feedback', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const res = await POST(
      makeRequest({ form: 'booking', rating: 'up', comment: 'Nice!' })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.recorded).toBe(true)
  })

  it('handles missing table gracefully', async () => {
    mockInsert.mockResolvedValue({ error: { code: '42P01' } })

    const res = await POST(makeRequest({ form: 'booking', rating: 'down' }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.recorded).toBe(false)
  })
})
