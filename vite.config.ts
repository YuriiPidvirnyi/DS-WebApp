import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',
  base: '/',
  plugins: [
    react(),
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
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/(fonts\.gstatic\.com|fonts\.googleapis\.com)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Vendor chunks
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }
          if (
            id.includes('node_modules/@hookform') ||
            id.includes('node_modules/react-hook-form')
          ) {
            return 'forms-vendor'
          }
          if (id.includes('node_modules/react-helmet-async')) {
            return 'seo-vendor'
          }
          if (id.includes('node_modules/axios')) {
            return 'http-vendor'
          }
          // Don't pre-bundle Sentry - let it load dynamically
          // if (id.includes('node_modules/@sentry')) {
          //   return 'sentry-vendor'
          // }
          if (id.includes('node_modules/zod')) {
            return 'validation-vendor'
          }

          // Pages chunks
          if (id.includes('/pages/Home')) return 'home-page'
          if (id.includes('/pages/Booking')) return 'booking-page'
          if (id.includes('/pages/Services')) return 'services-page'
          if (id.includes('/pages/About')) return 'about-page'
          if (id.includes('/pages/Contact')) return 'contact-page'
          if (id.includes('/pages/Gallery')) return 'gallery-page'

          // Components chunks
          if (id.includes('/components/BookingForm'))
            return 'booking-components'
          if (id.includes('/components/Accessibility')) return 'a11y-components'
          if (id.includes('/components/GoogleMap')) return 'map-components'

          // Other vendor packages
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
