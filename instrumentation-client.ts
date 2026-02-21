import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (dsn) {
  Sentry.init({
    dsn,
    environment,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.2 : 0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    integrations: [
      Sentry.replayIntegration({
        maskAllInputs: true,
        maskTextSelector: '[data-mask]',
        blockAllMedia: true,
      }),
    ],

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
}
