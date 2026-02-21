import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per Edge instance — resets on cold start)
// For production-scale limiting use Upstash Redis or similar.
// ---------------------------------------------------------------------------
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_API = 60 // 60 requests / min per IP on /api/*

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(
  ip: string,
  max: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitStore.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

// ---------------------------------------------------------------------------
// CSP nonce
// ---------------------------------------------------------------------------
function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // URL-safe base64 (no padding)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const ga = 'https://www.googletagmanager.com https://www.google-analytics.com'
  const sentry = 'https://*.ingest.sentry.io'

  return [
    "default-src 'self'",
    // Allow nonce-tagged scripts + GA + Sentry; unsafe-eval only in dev (Next HMR)
    `script-src 'self' 'nonce-${nonce}' ${ga}${isDev ? " 'unsafe-eval'" : ''}`,
    // Inline styles are unavoidable with Tailwind CSS
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://www.google-analytics.com https://dentalstory.com.ua https://api.cliniccards.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${ga} https://api.cliniccards.com ${sentry}`,
    // Google Maps embeds
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------
const SUPPORTED_LOCALES = ['uk', 'en', 'pl'] as const
const DEFAULT_LOCALE = 'uk'

function detectLocale(request: NextRequest): string {
  // 1. Respect existing cookie (set by i18next-browser-languagedetector)
  const cookieLang = request.cookies.get('i18nextLng')?.value
  if (cookieLang && SUPPORTED_LOCALES.includes(cookieLang as never)) {
    return cookieLang
  }

  // 2. Parse Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
  for (const part of acceptLang.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2).toLowerCase()
    if (SUPPORTED_LOCALES.includes(code as never)) return code
  }

  return DEFAULT_LOCALE
}

// ---------------------------------------------------------------------------
// Proxy (Next.js 16 — replaces middleware.ts)
// ---------------------------------------------------------------------------
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // --- Rate limiting: /api/* only (skip health endpoint) ---
  if (pathname.startsWith('/api/') && pathname !== '/api/health') {
    const ip = getClientIp(request)
    const {
      allowed,
      remaining: _remaining,
      resetAt,
    } = checkRateLimit(ip, RATE_LIMIT_MAX_API)

    if (!allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_API),
          'X-RateLimit-Remaining': '0',
        },
      })
    }
  }

  // --- Bot protection: reject requests with no User-Agent ---
  const ua = request.headers.get('user-agent') ?? ''
  if (!ua && pathname !== '/api/health') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // --- Build nonce + CSP ---
  const nonce = generateNonce()
  const csp = buildCSP(nonce)

  // Forward nonce as a request header so Server Components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // --- Security headers ---
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Nonce', nonce) // Expose for debugging
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )

  // --- Locale cookie (set if missing or changed) ---
  const locale = detectLocale(request)
  if (request.cookies.get('i18nextLng')?.value !== locale) {
    response.cookies.set('i18nextLng', locale, {
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
      path: '/',
      httpOnly: false, // Must be readable by JS (i18next browser detector)
    })
  }

  return response
}

// Run on all routes except Next.js internals, static files, and PWA assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|workbox-.*\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4|pdf|woff2?|ttf|otf)).*)',
  ],
}
