import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://challenges.cloudflare.com',
    // Sentry Session Replay lazy-loads from this CDN
    'https://browser.sentry-cdn.com',
    // @vercel/analytics (script.debug.js in dev, script.js in prod)
    'https://va.vercel-scripts.com',
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ')

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://www.google-analytics.com https://*.supabase.co https://api.cliniccards.com",
    "font-src 'self' https://fonts.gstatic.com",
    // ai-gateway.vercel.sh: Vercel AI Gateway — routes streamText/generateText calls server-side
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.sentry.io https://*.vercel-insights.com https://api.cliniccards.com https://challenges.cloudflare.com https://ai-gateway.vercel.sh",
    "worker-src blob: 'self'",
    "frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ]
  return directives.join('; ')
}

/**
 * Next.js proxy
 * Applies security headers to all responses and runs Supabase auth session checks.
 */
export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  const nonce = generateNonce()
  response.headers.set('x-nonce', nonce)

  const cspHeaderValue = buildCSP(nonce)
  const reportOnly = process.env.CSP_REPORT_ONLY === 'true'
  response.headers.set(
    reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy',
    cspHeaderValue
  )
  // Keep a mirrored report-only header in enforced mode for observability.
  if (!reportOnly) {
    response.headers.set('Content-Security-Policy-Report-Only', cspHeaderValue)
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - monitoring (Sentry tunnel)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|monitoring|assets/|sw.js|workbox-).*)',
  ],
}
