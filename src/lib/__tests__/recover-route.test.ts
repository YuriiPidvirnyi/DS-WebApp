import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Capture next/server's `after()` callbacks so the test can flush the deferred
// mint+send work (the route runs it post-response for timing uniformity).
const afterCallbacks: Array<() => unknown> = []
vi.mock('next/server', async importOriginal => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => unknown) => {
      afterCallbacks.push(fn)
    },
  }
})
async function flushAfter() {
  const cbs = afterCallbacks.splice(0)
  await Promise.all(cbs.map(fn => fn()))
}

const generateLink = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { generateLink } },
  })),
}))

const sendEmail = vi.fn(
  async (_params: {
    to: string
    subject: string
    html: string
    text?: string
  }) => ({
    success: true as const,
    id: 'e1',
  })
)
const isEmailConfigured = vi.fn(() => true)
vi.mock('@/lib/email', () => ({
  sendEmail: (params: { to: string; subject: string; html: string }) =>
    sendEmail(params),
  isEmailConfigured: () => isEmailConfigured(),
}))

vi.mock('@/lib/api-security', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
  rateLimitResponse: vi.fn(
    () => new Response(JSON.stringify({ success: false }), { status: 429 })
  ),
  validateCSRF: vi.fn(() => true),
  csrfErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 })
  ),
  memoryRateLimit: vi.fn(() => ({ allowed: true, remaining: 2 })),
}))

const keyedRateLimit = vi.fn(async () => ({
  allowed: true,
  remaining: 2,
  resetAt: 0,
}))
vi.mock('@/lib/redis', () => ({
  checkRateLimit: (...a: unknown[]) =>
    (keyedRateLimit as (...x: unknown[]) => unknown)(...a),
}))

vi.mock('@/utils/sentry', () => ({ captureException: vi.fn() }))

import { POST } from '../../../app/api/auth/recover/route'
import {
  validateCSRF,
  checkRateLimit,
  memoryRateLimit,
} from '@/lib/api-security'

const OLD_ENV = process.env
beforeEach(() => {
  vi.clearAllMocks()
  afterCallbacks.length = 0
  process.env = {
    ...OLD_ENV,
    NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'svc',
    NEXT_PUBLIC_SITE_URL: 'https://clinic.example.com',
  }
  generateLink.mockResolvedValue({
    data: {
      properties: { hashed_token: 'HASHED123' },
      user: { user_metadata: { first_name: 'Олена' } },
    },
    error: null,
  })
  isEmailConfigured.mockReturnValue(true)
  keyedRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetAt: 0 })
})

function makeRequest(body?: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/recover', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(32),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

describe('POST /api/auth/recover', () => {
  it('generates a recovery token and sends a click-gated confirm link', async () => {
    const res = await POST(
      makeRequest({ email: 'p@example.com', locale: 'uk' })
    )
    expect(res.status).toBe(200)
    await flushAfter()

    expect(generateLink).toHaveBeenCalledWith({
      type: 'recovery',
      email: 'p@example.com',
    })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const arg = sendEmail.mock.calls[0][0] as { html: string; to: string }
    expect(arg.to).toBe('p@example.com')
    // link goes to the click-gated page with the token, never Supabase /verify
    expect(arg.html).toContain(
      '/auth/confirm?token_hash=HASHED123&type=recovery'
    )
    expect(arg.html).toContain('next=%2Fauth%2Freset-password')
    expect(arg.html).not.toContain('/auth/v1/verify')
  })

  it('does not reveal that an account is unknown (still 200, no email)', async () => {
    generateLink.mockResolvedValue({
      data: { properties: null, user: null },
      error: { message: 'User not found' },
    })

    const res = await POST(makeRequest({ email: 'nobody@example.com' }))
    const json = await res.json()
    await flushAfter()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('rejects an invalid CSRF token', async () => {
    vi.mocked(validateCSRF).mockReturnValueOnce(false)
    const res = await POST(makeRequest({ email: 'p@example.com' }))
    expect(res.status).toBe(403)
    expect(generateLink).not.toHaveBeenCalled()
  })

  it('rate limits', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
    })
    const res = await POST(makeRequest({ email: 'p@example.com' }))
    expect(res.status).toBe(429)
  })

  it('rejects a malformed email with 400', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
    expect(generateLink).not.toHaveBeenCalled()
  })

  it('still returns 200 (no leak) when email delivery is not configured', async () => {
    isEmailConfigured.mockReturnValue(false)
    const res = await POST(makeRequest({ email: 'p@example.com' }))
    expect(res.status).toBe(200)
    await flushAfter()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('suppresses the email over the per-email cap (silent 200, no send/mint)', async () => {
    keyedRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: 0,
    })
    const res = await POST(makeRequest({ email: 'victim@example.com' }))
    const json = await res.json()
    await flushAfter()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // neither a token is minted nor an email sent — anti inbox-spam
    expect(generateLink).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('falls back to the in-memory limiter and still sends when Redis is down but under the memory cap', async () => {
    keyedRateLimit.mockRejectedValue(new Error('redis down'))
    vi.mocked(memoryRateLimit).mockReturnValueOnce({
      allowed: true,
      remaining: 1,
    })
    const res = await POST(makeRequest({ email: 'p@example.com' }))
    expect(res.status).toBe(200)
    await flushAfter()
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('suppresses delivery when Redis is down AND the in-memory fallback is over cap (bounded, not fail-open)', async () => {
    keyedRateLimit.mockRejectedValue(new Error('redis down'))
    vi.mocked(memoryRateLimit).mockReturnValue({ allowed: false, remaining: 0 })
    const res = await POST(makeRequest({ email: 'victim@example.com' }))
    expect(res.status).toBe(200)
    await flushAfter()
    // Redis outage must NOT become an email-bomb vector: over the memory cap,
    // no token is minted and no mail is sent.
    expect(generateLink).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
