import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // React strict mode for catching issues early
  reactStrictMode: true,

  // Output as standalone for optimized Docker/Vercel deployment
  // output: 'standalone', // Uncomment if deploying via Docker

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.cliniccards.com',
      },
      {
        protocol: 'https',
        hostname: 'dentalstory.com.ua',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers (migrated from vercel.json)
  async headers() {
    return [
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ]
  },

  // Redirects (SPA rewrites are no longer needed — Next.js handles routing)
  async redirects() {
    return []
  },

  // Webpack config — keep @/* alias working alongside tsconfig paths
  webpack(config) {
    return config
  },

  // Experimental features
  experimental: {
    // typedRoutes: true, // Enable when all routes are migrated
  },

  // Environment variables exposed to the browser (type-safe access)
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.com.ua',
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress noisy Sentry CLI output during build
  silent: !process.env.CI,

  // Disable source map upload unless SENTRY_AUTH_TOKEN is set
  sourceMaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Tunnel Sentry requests through /monitoring to avoid ad-blockers
  tunnelRoute: '/monitoring',
})
