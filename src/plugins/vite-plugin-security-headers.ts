import type { Plugin } from 'vite'

/**
 * Vite plugin to inject security headers in development
 */
export function securityHeadersPlugin(): Plugin {
  return {
    name: 'vite-plugin-security-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('X-XSS-Protection', '1; mode=block')
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        res.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=()'
        )

        // CSP for development (more permissive for HMR)
        res.setHeader(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' ws: wss: https://www.google-analytics.com https://api.cliniccards.com",
            "frame-src 'self' https://www.google.com https://maps.google.com",
            "worker-src 'self' blob:", // Allow Vite HMR workers
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join('; ')
        )

        next()
      })
    },
  }
}
