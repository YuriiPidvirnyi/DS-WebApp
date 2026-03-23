import * as Sentry from '@sentry/nextjs'

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

Sentry.init({
  dsn: 'https://6c85c1212128b5de1b95d731dac3823c@o4511077757616128.ingest.de.sentry.io/4511077761876048',
  environment,
  debug: false,

  tracesSampleRate: environment === 'production' ? 0.1 : 1,

  sendDefaultPii: false,
})
