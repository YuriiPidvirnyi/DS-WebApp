import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { securityHeadersPlugin } from './src/plugins/vite-plugin-security-headers'

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  base: '/',
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [],
      },
    }),
    securityHeadersPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/images/favicon/favicon-16x16.png',
        'assets/images/favicon/favicon-32x32.png',
        'assets/images/favicon/apple-touch-icon.png',
        'assets/images/favicon/safari-pinned-tab.svg',
      ],
      workbox: {
        navigateFallback: '/offline.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // Google Fonts - CacheFirst (long-term cache)
          {
            urlPattern:
              /^https:\/\/(fonts\.gstatic\.com|fonts\.googleapis\.com)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API responses - StaleWhileRevalidate (always fresh)
          {
            urlPattern: /^https:\/\/api\.cliniccards\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 minutes
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Images - CacheFirst with fallback
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Static assets (JS, CSS) - CacheFirst with long TTL
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Analytics - NetworkOnly (no cache)
          {
            urlPattern: /^https:\/\/www\.google-analytics\.com\//,
            handler: 'NetworkOnly',
          },
          // Same-origin navigation - NetworkFirst
          {
            urlPattern: /^\/[^.]*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 }, // 1 hour
            },
          },
        ],
      },
      manifest: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-helmet-async',
      'react-hot-toast',
      'react-i18next',
      'react-hook-form',
    ],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Let Vite handle chunking automatically
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'clsx',
      'react-helmet-async',
      'axios',
      // Force prebundle problematic CJS deps to ESM for dev
      'hoist-non-react-statics',
      'react-is',
    ],
    exclude: ['@sentry/react', '@sentry/replay', '@sentry/integrations'],
  },
  preview: {
    port: 4173,
    host: true,
  },
})
