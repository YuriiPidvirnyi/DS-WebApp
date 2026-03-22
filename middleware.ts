import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

function buildCSP(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://www.google-analytics.com https://*.supabase.co https://api.cliniccards.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.sentry.io https://*.vercel-insights.com https://api.cliniccards.com https://challenges.cloudflare.com",
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
 * Next.js Root Middleware
 * Applies security headers to all responses and runs Supabase auth session checks.
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const nonce = generateNonce()
  response.headers.set('x-nonce', nonce)

  response.headers.set('Content-Security-Policy-Report-Only', buildCSP(nonce))

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
