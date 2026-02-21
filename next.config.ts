import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withPWA from '@ducanh2912/next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Disable SW generation in development to keep fast refresh working
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Google Fonts — cache-first, 1 year
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Remote images (CliniCards CDN, clinic domain) — cache-first, 30 days
      {
        urlPattern:
          /^https:\/\/(?:api\.cliniccards\.com|dentalstory\.com\.ua)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'remote-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Internal /api/* routes — NetworkFirst, 24 h stale fallback
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Static assets (JS/CSS/images served by Next.js) — StaleWhileRevalidate
      {
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|avif|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 128, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // HTML pages — NetworkFirst with offline fallback
      {
        urlPattern: /^\/(?!api\/).*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

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

  // Static asset cache headers — security headers are set by middleware.ts
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
      // PWA service worker — must not be cached
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
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

export default withSentryConfig(withPWAConfig(nextConfig), {
  // Suppress noisy Sentry CLI output during build
  silent: !process.env.CI,

  // Disable source map upload unless SENTRY_AUTH_TOKEN is set
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Tunnel Sentry requests through /monitoring to avoid ad-blockers
  tunnelRoute: '/monitoring',
})
