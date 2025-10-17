/**
 * Sentry integration for error tracking
 */
import * as Sentry from '@sentry/react';
import { Replay } from '@sentry/replay';

/**
 * Initialize Sentry error tracking
 */
export const initializeSentry = (): void => {
  if (typeof window === 'undefined') return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  // Do not initialize Sentry in development unless explicitly requested
  if (environment === 'development' && !import.meta.env.VITE_ENABLE_SENTRY_IN_DEV) {
    console.log('Sentry disabled in development');
    return;
  }

  // Check if Sentry DSN exists in environment variables
  if (!dsn) {
    console.warn('Sentry DSN not found in environment variables');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        // Enable session replay to help reproduce user issues
        new Replay({
          // Capture 10% of all sessions
          sessionSampleRate: 0.1,
          // Capture 100% of sessions with errors
          errorSampleRate: 1.0,
          // Mask user inputs by default for privacy
          maskAllInputs: true,
          maskTextSelector: '[data-mask]',
          blockAllMedia: true,
        }),
      ],
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
          return null;
        }
        
        // Filter out non-critical errors if needed
        if (event.exception && event.exception.values) {
          const exceptionValue = event.exception.values[0]?.value || '';
          // Ignore certain errors we don't want to track
          if (
            exceptionValue.includes('ResizeObserver loop limit exceeded') ||
            exceptionValue.includes('Network request failed') ||
            exceptionValue.includes('Load failed')
          ) {
            return null;
          }
        }
        return event;
      },
      
      // Maximum number of breadcrumbs to capture
      maxBreadcrumbs: 50,
    });

    console.log('Sentry initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

/**
 * Set user information in Sentry
 * @param userId User ID if available
 * @param userData Additional user data (avoid PII)
 */
export const setSentryUser = (userId?: string, userData?: Record<string, unknown>): void => {
  try {
    if (userId) {
      Sentry.setUser({
        id: userId,
        ...userData,
      });
    } else {
      Sentry.setUser(null); // Clear user context
    }
  } catch (error) {
    console.error('Error setting Sentry user:', error);
  }
};

/**
 * Add additional context to Sentry events
 * @param tags Tags to add to Sentry events
 */
export const setSentryTags = (tags: Record<string, string>): void => {
  try {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  } catch (error) {
    console.error('Error setting Sentry tags:', error);
  }
};

/**
 * Manually capture an exception in Sentry
 * @param error The error to capture
 * @param context Additional context for the error
 */
export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (sentryError) {
    console.error('Error capturing exception in Sentry:', sentryError);
  }
};