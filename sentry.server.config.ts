import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

if (dsn) {
  Sentry.init({
    dsn,
    environment,

    // Lower sample rate on server to reduce overhead
    tracesSampleRate: environment === 'production' ? 0.1 : 0,

    maxBreadcrumbs: 50,
  })
}
