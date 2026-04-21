import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit as redisRateLimit } from '@/lib/redis'

/**
 * Rate limiter for API routes.
 * Uses Redis (Upstash) when available — works across multiple Vercel instances.
 * Falls back to in-memory Map when Redis is unavailable.
 */

// ── In-memory fallback ───────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = Date.now()

function cleanupExpired(now: number) {
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) rateLimitMap.delete(key)
  }
}

/** In-memory fallback when Redis is unavailable */
export function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  cleanupExpired(now)

  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  }
}

// ── Public API (same signature as before) ────────────────────────────

/**
 * Check rate limit for a request.
 * Prefers Redis; falls back to in-memory when Redis is unavailable.
 */
export async function checkRateLimit(
  request: NextRequest,
  limit = 30,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number }> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const identifier = `${ip}:${request.nextUrl.pathname}`
  const windowSeconds = Math.ceil(windowMs / 1000)

  // Try Redis first
  const result = await redisRateLimit(identifier, limit, windowSeconds)

  return {
    allowed: result.allowed,
    remaining: result.remaining,
  }
}

export function rateLimitResponse(remaining: number): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Забагато запитів. Спробуйте пізніше.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Remaining': String(remaining),
      },
    }
  )
}

/**
 * Validate CSRF token from request header.
 * Custom headers cannot be set by cross-origin forms/links,
 * so requiring a custom header provides CSRF protection.
 */
export function validateCSRF(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true

  const csrfToken = request.headers.get('X-CSRF-Token')
  return !!csrfToken && csrfToken.length >= 32
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Невалідний CSRF токен' },
    { status: 403 }
  )
}

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Server-side Turnstile verification — calls Cloudflare directly.
 * Returns { valid: true } when TURNSTILE_SECRET_KEY is not set (dev/CI).
 */
export async function verifyTurnstileServer(
  token: string | undefined,
  request: NextRequest
): Promise<{ valid: boolean }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) return { valid: true }
  if (!token) return { valid: false }

  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined

    const form = new URLSearchParams()
    form.append('secret', secretKey)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) return { valid: false }
    const data = (await res.json()) as { success?: boolean }
    return { valid: data.success === true }
  } catch {
    return { valid: false }
  }
}

export function turnstileInvalidResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Перевірка CAPTCHA не пройдена. Спробуйте ще раз.',
    },
    { status: 400 }
  )
}
