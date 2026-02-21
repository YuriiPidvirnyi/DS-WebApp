/**
 * Next.js Instrumentation Hook
 * Runs once when the Next.js server starts (or edge runtime initialises).
 * @sentry/nextjs requires this file to register server/edge Sentry configs.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config')
  }
}

// Capture errors from nested React Server Components
export const onRequestError = Sentry.captureRequestError
