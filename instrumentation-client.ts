import * as Sentry from '@sentry/nextjs'

const dsn =
  process.env.SENTRY_DSN ||
  'https://6c85c1212128b5de1b95d731dac3823c@o4511077757616128.ingest.de.sentry.io/4511077761876048'
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (dsn) {
  Sentry.init({
    dsn,
    environment,

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

  // Lazy-load Session Replay after the browser is idle to avoid blocking
  // the main thread during page load (~100KB payload).
  if (typeof window !== 'undefined') {
    const loadReplay = () => {
      Sentry.lazyLoadIntegration('replayIntegration').then(
        replayIntegration => {
          Sentry.addIntegration(
            replayIntegration({
              maskAllInputs: true,
              blockAllMedia: true,
            })
          )
        }
      )
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadReplay)
    } else {
      setTimeout(loadReplay, 3000)
    }
  }
}
