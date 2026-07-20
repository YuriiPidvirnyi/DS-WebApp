import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withPWA from '@ducanh2912/next-pwa'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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
      // Remote images (clinic domain) — cache-first, 30 days
      {
        urlPattern: /^https:\/\/(?:dentalstory\.com\.ua|dentalstory\.ua)\/.*/i,
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

  // Pin the workspace root explicitly. When it is inferred, a stray lockfile
  // in a PARENT directory (present on GitHub Actions runner images) makes
  // Turbopack misdetect the root — the production server then spins in
  // infinite module re-resolution and allocates until OOM without serving a
  // single request (vercel/next.js#92978; bit our e2e jobs on PR #359).
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,

  // Gzip/Brotli compression for all responses
  compress: true,

  // Remove the X-Powered-By header (security + marginal byte saving)
  poweredByHeader: false,

  // Allow preview tools accessing via 127.0.0.1 in dev
  allowedDevOrigins: ['127.0.0.1'],

  // Output as standalone for optimized Docker/Vercel deployment
  // output: 'standalone', // Uncomment if deploying via Docker

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dentalstory.ua',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Allow SVG images (used for placeholder assets until real photos are provided)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Canonical domain redirect: dentalstory.com.ua → dentalstory.ua
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dentalstory.com.ua' }],
        destination: 'https://dentalstory.ua/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dentalstory.com.ua' }],
        destination: 'https://dentalstory.ua/:path*',
        permanent: true,
      },
    ]
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
    ]
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@sentry/nextjs',
      // DO NOT add 'i18next' or 'react-i18next' here —
      // it breaks JSON resource loading, stripping keys from translation bundles
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
      process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua',
  },
}

export default withBundleAnalyzer(
  withSentryConfig(withPWAConfig(nextConfig), {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: 'dental-story',

    project: 'sentry-dentalstory-webapp',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    webpack: {
      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,

      // Tree-shaking options for reducing bundle size
      treeshake: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        removeDebugLogging: true,
      },
    },
  })
)
