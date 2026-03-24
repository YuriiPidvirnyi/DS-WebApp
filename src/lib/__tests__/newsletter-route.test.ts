import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({ insert: mockInsert })),
  })),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
  rateLimitResponse: vi.fn(),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
}))

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { POST } from '../../../app/api/newsletter/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('validates email format', async () => {
    const res = await POST(makeRequest({ email: 'invalid' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('email')
  })

  it('rejects empty email', async () => {
    const res = await POST(makeRequest({ email: '' }))
    expect(res.status).toBe(400)
  })

  it('subscribes valid email', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const res = await POST(makeRequest({ email: 'test@example.com' }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.subscribed).toBe(true)
  })

  it('handles duplicate email gracefully', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } })

    const res = await POST(makeRequest({ email: 'existing@example.com' }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.alreadyExists).toBe(true)
  })
})
