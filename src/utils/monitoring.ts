/**
 * Monitoring and error tracking utilities
 * Sentry integration for production error tracking
 */

import * as Sentry from '@sentry/nextjs'

export interface MonitoringConfig {
  dsn: string
  environment: string
  release?: string
  sampleRate?: number
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

/**
 * Initialize Sentry monitoring
 */
export function initMonitoring(config: MonitoringConfig): void {
  if (!config.dsn) {
    console.warn('Sentry DSN not provided, monitoring disabled')
    return
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,

    // Performance monitoring
    integrations: [
      // Sentry integrations configured automatically
    ],

    // Sampling rates
    tracesSampleRate: config.tracesSampleRate || 0.1, // 10% of transactions
    replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1, // 10% of sessions
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0, // 100% of errors

    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (config.environment === 'development' && !hint.originalException) {
        return null
      }

      // Filter out known browser extension errors
      if (
        event.exception?.values?.some(
          e =>
            e.value?.includes('chrome-extension://') ||
            e.value?.includes('moz-extension://')
        )
      ) {
        return null
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Network errors (often user connectivity issues)
      'NetworkError',
      'Network request failed',

      // Cancelled requests
      'AbortError',
      'Request aborted',
    ],

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out console logs in production
      if (
        config.environment === 'production' &&
        breadcrumb.category === 'console'
      ) {
        return null
      }

      return breadcrumb
    },
  })
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture message for logging
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Set user context
 */
export function setUser(user: {
  id?: string
  email?: string
  username?: string
}): void {
  Sentry.setUser(user)
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  addBreadcrumb(eventName, 'event', properties)

  // Also send to GA if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag('event', eventName, properties)
  }
}

/**
 * Performance measurement
 */
export function measurePerformance(
  _name: string,
  callback: () => void | Promise<void>
): void {
  try {
    const result = callback()

    if (result instanceof Promise) {
      result.catch(error => {
        captureException(error)
      })
    }
  } catch (error) {
    captureException(error as Error)
  }
}

/**
 * Monitor API call
 */
export async function monitorApiCall<T>(
  endpoint: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    const result = await callback()
    return result
  } catch (error) {
    captureException(error as Error, { endpoint })
    throw error
  }
}

/**
 * Error boundary helper
 */
export const ErrorBoundary = Sentry.ErrorBoundary

/**
 * Profiler for React component performance
 */
export const Profiler = Sentry.Profiler

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  checks: Record<string, boolean>
}> {
  const checks: Record<string, boolean> = {}

  // Check API connectivity
  try {
    const response = await fetch('/api/health', { method: 'HEAD' })
    checks.api = response.ok
  } catch {
    checks.api = false
  }

  // Check browser features
  checks.localStorage = typeof localStorage !== 'undefined'
  checks.sessionStorage = typeof sessionStorage !== 'undefined'
  checks.fetch = typeof fetch !== 'undefined'

  const allHealthy = Object.values(checks).every(check => check)

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
  }
}

/**
 * Report web vitals to monitoring
 */
export function reportWebVitals(metric: {
  name: string
  value: number
  rating?: string
}): void {
  // Report to Sentry
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond')

  // Report to GA
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }
}

/**
 * Initialize monitoring in app
 */
export function setupMonitoring(): void {
  const config: MonitoringConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  }

  if (config.dsn) {
    initMonitoring(config)
  }

  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', event => {
      captureException(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { reason: event.reason }
      )
    })
  }
}
