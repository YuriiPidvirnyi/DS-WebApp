import * as Sentry from '@sentry/react'

interface ErrorTrackingConfig {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

class ErrorTracker {
  private initialized = false
  private config: ErrorTrackingConfig

  constructor(config: ErrorTrackingConfig) {
    this.config = {
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      ...config,
    }
  }

  init() {
    if (this.initialized || !this.config.dsn) return

    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release:
          this.config.release ||
          `dental-story@${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`,

        // Integration configuration
        integrations: [
          // Session replay
          Sentry.replayIntegration({
            maskAllText: false,
            maskAllInputs: true,
            blockAllMedia: false,
          }),
        ],

        // Performance monitoring
        tracesSampleRate: this.config.tracesSampleRate,

        // Breadcrumbs configuration
        beforeBreadcrumb: breadcrumb => {
          // Filter out noisy breadcrumbs
          if (
            breadcrumb.category === 'console' &&
            breadcrumb.level === 'debug'
          ) {
            return null
          }

          // Sanitize sensitive data from breadcrumbs
          if (breadcrumb.data && typeof breadcrumb.data === 'object') {
            const sanitized = this.sanitizeData(breadcrumb.data)
            return { ...breadcrumb, data: sanitized }
          }

          return breadcrumb
        },

        // Error filtering
        beforeSend: (event, hint) => {
          // Filter out known non-critical errors
          const error = hint.originalException

          if (this.shouldIgnoreError(error)) {
            return null
          }

          // Add user context if available
          const userContext = this.getUserContext()
          if (userContext) {
            event.user = { ...event.user, ...userContext }
          }

          // Add custom tags
          event.tags = {
            ...event.tags,
            browser: this.getBrowserInfo(),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connection:
              (navigator as any).connection?.effectiveType || 'unknown',
          }

          // Sanitize sensitive data
          if (event.request?.data) {
            event.request.data = this.sanitizeData(event.request.data)
          }

          return event
        },

        // Transaction sampling
        tracesSampler: samplingContext => {
          // Higher sample rate for important transactions
          if (samplingContext.transactionContext.name?.includes('booking')) {
            return 1.0
          }

          if (samplingContext.transactionContext.name?.includes('payment')) {
            return 1.0
          }

          // Lower sample rate for static pages
          if (samplingContext.transactionContext.name?.includes('static')) {
            return 0.01
          }

          return this.config.tracesSampleRate || 0.1
        },

        // Ignore certain errors
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',

          // Network errors
          'Network request failed',
          'NetworkError',
          'Failed to fetch',

          // User actions
          'User cancelled',
          'user aborted',
          'AbortError',
        ],

        // Attachments
        attachStacktrace: true,

        // Source maps
        dist: process.env.NEXT_PUBLIC_BUILD_ID,
      })

      this.initialized = true
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('Sentry initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize Sentry:', error)
    }
  }

  private shouldIgnoreError(error: any): boolean {
    if (!error) return false

    // Ignore specific error messages
    const ignoredMessages = [
      'ResizeObserver',
      'Non-Error promise',
      'Network request failed',
      'User cancelled',
      'Extension context',
    ]

    const errorMessage = error?.message || error?.toString() || ''
    return ignoredMessages.some(msg => errorMessage.includes(msg))
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sensitiveKeys = [
      'password',
      'token',
      'api_key',
      'secret',
      'credit_card',
      'ssn',
      'phone',
    ]
    const sanitized = { ...data }

    for (const key in sanitized) {
      if (
        sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }

    return sanitized
  }

  private getUserContext() {
    // Get user info from localStorage or session if available
    try {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        return {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          // Don't include sensitive data
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return null
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent

    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    if (ua.includes('Opera')) return 'Opera'

    return 'Other'
  }

  // Public methods for manual error tracking
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.initialized) return

    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    })
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (!this.initialized) return

    Sentry.captureMessage(message, level)
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    if (!this.initialized) return

    Sentry.addBreadcrumb(breadcrumb)
  }

  setUser(user: Sentry.User | null) {
    if (!this.initialized) return

    Sentry.setUser(user)
  }

  setContext(name: string, context: Record<string, any>) {
    if (!this.initialized) return

    Sentry.setContext(name, context)
  }

  setTag(key: string, value: string) {
    if (!this.initialized) return

    Sentry.setTag(key, value)
  }

  // Performance monitoring helpers
  measurePageLoad() {
    if (!this.initialized || !window.performance) return

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming

    if (navigation) {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: 'Page load performance',
        level: 'info',
        data: {
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize,
          decodedBodySize: navigation.decodedBodySize,
        },
      })
    }
  }

  profileComponent(componentName: string, fn: () => void) {
    if (!this.initialized) {
      fn()
      return
    }

    Sentry.addBreadcrumb({
      category: 'ui.react',
      message: `Rendering ${componentName}`,
      level: 'info',
    })

    fn()
  }

  // Cleanup
  close(timeout?: number) {
    if (!this.initialized) return

    return Sentry.close(timeout)
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: process.env.NODE_ENV !== "production" ? 1.0 : 0.1,
  replaysSessionSampleRate: process.env.NODE_ENV !== "production" ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
})

export default errorTracker
export { ErrorTracker }
