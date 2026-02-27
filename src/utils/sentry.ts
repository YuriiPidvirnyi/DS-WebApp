/**
 * Sentry helpers for client-side use.
 * Actual Sentry initialisation is handled by:
 *   sentry.client.config.ts  — browser
 *   sentry.server.config.ts  — Node.js / Edge (via instrumentation.ts)
 * This file only re-exports thin wrappers so the rest of the codebase
 * doesn’t import from @sentry/nextjs directly.
 */
import * as Sentry from '@sentry/nextjs'

/**
 * No-op stub kept for backward compatibility.
 * Sentry is now initialised via sentry.client.config.ts / instrumentation.ts.
 */
export const initializeSentry = async (): Promise<void> => {
  // Handled by @sentry/nextjs automatic instrumentation
}

/** Set (or clear) the current user in Sentry. */
export const setSentryUser = (
  userId?: string,
  userData?: Record<string, unknown>
): void => {
  try {
    if (userId) {
      Sentry.setUser({ id: userId, ...userData })
    } else {
      Sentry.setUser(null)
    }
  } catch (e) {
    console.error('setSentryUser failed:', e)
  }
}

/** Attach custom tags to all subsequent Sentry events. */
export const setSentryTags = (tags: Record<string, string>): void => {
  try {
    Object.entries(tags).forEach(([k, v]) => Sentry.setTag(k, v))
  } catch (e) {
    console.error('setSentryTags failed:', e)
  }
}

/** Capture an exception and send it to Sentry. */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>
): void => {
  try {
    Sentry.captureException(error, { extra: context })
  } catch (_e) {
    console.error('captureException failed, logging locally:', error)
  }
}
