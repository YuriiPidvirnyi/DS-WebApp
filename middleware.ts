import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Root Middleware
 * Applies security headers to all responses and runs Supabase auth session checks.
 */
export async function middleware(request: NextRequest) {
  // Run Supabase session middleware (auth protection for /cabinet, /admin)
  const response = await updateSession(request)

  // --- Security Headers ---
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
