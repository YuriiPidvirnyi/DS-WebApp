import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withPWA from '@ducanh2912/next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  // Disable SW in all environments for now to prevent hydration mismatches
  disable: true,
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
      // HTML pages — NetworkOnly to prevent stale content
      {
        urlPattern: /^\/(?!api\/).*/i,
        handler: 'NetworkOnly',
        options: {
          cacheName: 'pages-cache',
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  // React strict mode for catching issues early
  reactStrictMode: true,

  // Allow preview tools accessing via 127.0.0.1 in dev
  allowedDevOrigins: ['127.0.0.1'],

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
    // Allow SVG images (used for placeholder assets until real photos are provided)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Static asset cache headers — security headers are set by middleware.ts
  async headers() {
    return [
      // Immutable static assets (fonts, images in /assets)
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js static files (_next/static) — long cache
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image optimization cache
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // API routes — short cache with revalidation
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      // Admin API routes — no caching for sensitive data
      {
        source: '/api/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      // PWA service worker — must not be cached
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // Manifest and icons — moderate cache
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // HTML pages — no cache to prevent hydration mismatches
      {
        source: '/((?!api|_next|assets).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
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
    // Enable optimizations
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@sentry/nextjs',
      'react-i18next',
      'i18next',
    ],
  },

  // Enable modularizeImports for tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
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
