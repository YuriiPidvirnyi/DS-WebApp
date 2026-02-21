/**
 * Sentry integration for error tracking
 * Uses dynamic imports to reduce bundle size in development
 */
import type * as SentryTypes from '@sentry/react'
import { isErrorTrackingAllowed } from './consent'

// Lazy-loaded Sentry module
let Sentry: typeof SentryTypes | null = null

/**
 * Dynamically load Sentry module only when needed
 */
const loadSentry = async (): Promise<boolean> => {
  if (Sentry) return true // Already loaded

  try {
    Sentry = await import('@sentry/react')
    return true
  } catch (error) {
    console.error('Failed to load Sentry:', error)
    return false
  }
}

/**
 * Initialize Sentry error tracking with dynamic import
 */
export const initializeSentry = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  if (!isErrorTrackingAllowed()) return

  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development'

  // Do not initialize Sentry in development unless explicitly requested
  if (
    environment === 'development' &&
    !import.meta.env.VITE_ENABLE_SENTRY_IN_DEV
  ) {
    if (import.meta.env.DEV) {
      console.warn('Sentry disabled in development')
    }
    return
  }

  // Check if Sentry DSN exists and is valid
  if (
    !dsn ||
    dsn.includes('YOUR_SENTRY_DSN') ||
    dsn === 'your_sentry_dsn_here'
  ) {
    if (import.meta.env.DEV) {
      console.info('ℹ️ Sentry not configured (optional)')
    }
    return
  }

  // Dynamically load Sentry only when needed
  const loaded = await loadSentry()
  if (!loaded || !Sentry) {
    console.error('Failed to load Sentry modules')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        // Enable session replay to help reproduce user issues (v10 API)
        Sentry.replayIntegration({
          // Mask user inputs by default for privacy
          maskAllInputs: true,
          maskAllText: false,
          blockAllMedia: true,
        }),
      ],
      // Replay sample rates (moved from Replay integration)
      replaysSessionSampleRate: 0.1, // Capture 10% of all sessions
      replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
      // Enable performance monitoring
      tracesSampleRate: 0.2,

      // Set allowed domains to prevent reporting in local/development
      allowUrls: [
        'dentalstory.com.ua',
        'www.dentalstory.com.ua',
        // Add staging domains if needed
        'staging.dentalstory.com.ua',
      ],

      // Configure Sentry behavior
      beforeSend(event) {
        // Don't send events in development
        if (environment === 'development') {
          return null
        }

        // Filter out non-critical errors if needed
        if (event.exception && event.exception.values) {
          const exceptionValue = event.exception.values[0]?.value || ''
          // Ignore certain errors we don't want to track
          if (
            exceptionValue.includes('ResizeObserver loop limit exceeded') ||
            exceptionValue.includes('Network request failed') ||
            exceptionValue.includes('Load failed')
          ) {
            return null
          }
        }
        return event
      },

      // Maximum number of breadcrumbs to capture
      maxBreadcrumbs: 50,
    })

    if (import.meta.env.DEV) {
      console.warn('Sentry initialized')
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

/**
 * Set user information in Sentry
 * @param userId User ID if available
 * @param userData Additional user data (avoid PII)
 */
export const setSentryUser = async (
  userId?: string,
  userData?: Record<string, unknown>
): Promise<void> => {
  if (!Sentry) {
    const loaded = await loadSentry()
    if (!loaded || !Sentry) return
  }

  try {
    if (userId) {
      Sentry.setUser({
        id: userId,
        ...userData,
      })
    } else {
      Sentry.setUser(null) // Clear user context
    }
  } catch (error) {
    console.error('Error setting Sentry user:', error)
  }
}

/**
 * Add additional context to Sentry events
 * @param tags Tags to add to Sentry events
 */
export const setSentryTags = async (
  tags: Record<string, string>
): Promise<void> => {
  if (!Sentry) {
    const loaded = await loadSentry()
    if (!loaded || !Sentry) return
  }

  try {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry?.setTag(key, value)
    })
  } catch (error) {
    console.error('Error setting Sentry tags:', error)
  }
}

/**
 * Manually capture an exception in Sentry
 * @param error The error to capture
 * @param context Additional context for the error
 */
export const captureException = async (
  error: Error,
  context?: Record<string, unknown>
): Promise<void> => {
  if (!Sentry) {
    const loaded = await loadSentry()
    if (!loaded || !Sentry) {
      console.error('Sentry not loaded, logging error locally:', error)
      return
    }
  }

  try {
    Sentry.captureException(error, {
      extra: context,
    })
  } catch (sentryError) {
    console.error('Error capturing exception in Sentry:', sentryError)
  }
}
