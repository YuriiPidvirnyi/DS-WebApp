import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock redis module before importing api-security
vi.mock('@/lib/redis', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60_000,
  }),
}))

import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from './api-security'
import { checkRateLimit as redisRateLimit } from '@/lib/redis'
import { NextRequest } from 'next/server'

function makeRequest(
  path: string,
  method = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  })
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Redis rate limiter with correct identifier', async () => {
    const request = makeRequest('/api/reviews')
    await checkRateLimit(request, 30, 60_000)

    expect(redisRateLimit).toHaveBeenCalledWith(
      '127.0.0.1:/api/reviews',
      30,
      60
    )
  })

  it('returns allowed: true when under limit', async () => {
    const request = makeRequest('/api/contacts')
    const result = await checkRateLimit(request, 10, 60_000)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(29)
  })

  it('returns allowed: false when over limit', async () => {
    vi.mocked(redisRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    })

    const request = makeRequest('/api/newsletter')
    const result = await checkRateLimit(request, 5, 60_000)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('extracts IP from x-forwarded-for header', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    })
    await checkRateLimit(request)

    expect(redisRateLimit).toHaveBeenCalledWith('192.168.1.1:/api/test', 30, 60)
  })
})

describe('rateLimitResponse', () => {
  it('returns 429 status with correct headers', () => {
    const response = rateLimitResponse(0)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('returns Ukrainian error message', async () => {
    const response = rateLimitResponse(5)
    const body = await response.json()

    expect(body.success).toBe(false)
    expect(body.error).toContain('Забагато запитів')
  })
})

describe('validateCSRF', () => {
  it('allows GET requests without CSRF token', () => {
    const request = makeRequest('/api/reviews', 'GET')
    expect(validateCSRF(request)).toBe(true)
  })

  it('allows HEAD requests without CSRF token', () => {
    const request = makeRequest('/api/reviews', 'HEAD')
    expect(validateCSRF(request)).toBe(true)
  })

  it('rejects POST without CSRF token', () => {
    const request = makeRequest('/api/contacts', 'POST')
    expect(validateCSRF(request)).toBe(false)
  })

  it('rejects POST with short CSRF token', () => {
    const request = makeRequest('/api/contacts', 'POST', {
      'X-CSRF-Token': 'short',
    })
    expect(validateCSRF(request)).toBe(false)
  })

  it('accepts POST with valid CSRF token (32+ chars)', () => {
    const token = 'a'.repeat(32)
    const request = makeRequest('/api/contacts', 'POST', {
      'X-CSRF-Token': token,
    })
    expect(validateCSRF(request)).toBe(true)
  })
})

describe('csrfErrorResponse', () => {
  it('returns 403 status', () => {
    const response = csrfErrorResponse()
    expect(response.status).toBe(403)
  })

  it('returns CSRF error message', async () => {
    const response = csrfErrorResponse()
    const body = await response.json()

    expect(body.success).toBe(false)
    expect(body.error).toContain('CSRF')
  })
})
