import * as Sentry from '@sentry/nextjs'
import { hasConsent } from '@/utils/cookieConsent'

const dsn =
  process.env.SENTRY_DSN ||
  'https://6c85c1212128b5de1b95d731dac3823c@o4511077757616128.ingest.de.sentry.io/4511077761876048'
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    // Avoid console warning when webpack treeshake.removeDebugLogging strips Sentry debug helpers
    debug: false,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.2 : 0,

    // Session Replay — sample rates configure when replays are captured.
    // The actual replay integration is lazy-loaded below to reduce TBT.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Start without replay — lazy-loaded after idle (see below)
    integrations: [],

    // Only report from production domains
    allowUrls: [
      'dentalstory.com.ua',
      'www.dentalstory.com.ua',
      'staging.dentalstory.com.ua',
    ],

    beforeSend(event) {
      if (environment === 'development') return null

      const value = event.exception?.values?.[0]?.value ?? ''
      if (
        value.includes('ResizeObserver loop limit exceeded') ||
        value.includes('Network request failed') ||
        value.includes('Load failed')
      ) {
        return null
      }

      return event
    },

    maxBreadcrumbs: 50,
  })

  // Lazy-load Session Replay in production only, and only when the user has
  // accepted analytics cookies — replay captures screen content and is consent-sensitive.
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    const loadReplay = () => {
      if (!hasConsent()) return
      void Sentry.lazyLoadIntegration('replayIntegration')
        .then(replayIntegration => {
          Sentry.addIntegration(
            replayIntegration({
              maskAllInputs: true,
              blockAllMedia: true,
            })
          )
        })
        .catch(() => {
          // Integration load can fail if blocked; avoid uncaught promise noise
        })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadReplay)
    } else {
      setTimeout(loadReplay, 3000)
    }
  }
}
