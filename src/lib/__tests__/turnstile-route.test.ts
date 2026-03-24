import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 29 })),
  rateLimitResponse: vi.fn(),
}))

vi.mock('@/utils/sentry', () => ({
  captureException: vi.fn(),
}))

import { POST } from '../../../app/api/turnstile/verify/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/turnstile/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/turnstile/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.TURNSTILE_SECRET_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('skips verification when secret key is not configured', async () => {
    const res = await POST(makeRequest({ token: 'test-token' }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.hostname).toBe('localhost')
  })

  it('rejects missing token', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    const res = await POST(makeRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error_codes).toContain('missing-token')
  })

  it('verifies token against Cloudflare API', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    )

    const res = await POST(makeRequest({ token: 'valid-token' }))
    const body = await res.json()

    expect(body.success).toBe(true)
  })

  it('returns 502 when Cloudflare API fails', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    )

    const res = await POST(makeRequest({ token: 'token' }))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error_codes).toContain('cloudflare-api-error')
  })
})
