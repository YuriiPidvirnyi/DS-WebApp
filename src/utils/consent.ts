/**
 * Cookie consent management utility
 * Handles user consent preferences for GDPR compliance
 */

const CONSENT_STORAGE_KEY = 'ds-cookie-consent'
const CONSENT_VERSION = 1

export interface ConsentState {
  necessary: true
  analytics: boolean
  errorTracking: boolean
  timestamp: number
  version: number
}

/**
 * Get the current consent state from localStorage
 * Returns null if no consent decision has been made
 */
export const getConsent = (): ConsentState | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as ConsentState

    // Check version — if outdated, treat as no consent
    if (parsed.version !== CONSENT_VERSION) return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Save consent state to localStorage
 */
export const setConsent = (
  consent: Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>
): ConsentState => {
  const state: ConsentState = {
    necessary: true,
    analytics: consent.analytics,
    errorTracking: consent.errorTracking,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  }

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }

  return state
}

/**
 * Check if the user has made any consent decision
 */
export const hasConsented = (): boolean => {
  return getConsent() !== null
}

/**
 * Check if analytics tracking is allowed
 */
export const isAnalyticsAllowed = (): boolean => {
  const consent = getConsent()
  return consent?.analytics === true
}

/**
 * Check if error tracking (Sentry) is allowed
 */
export const isErrorTrackingAllowed = (): boolean => {
  const consent = getConsent()
  return consent?.errorTracking === true
}

/**
 * Accept all consent categories
 */
export const acceptAll = (): ConsentState => {
  return setConsent({ analytics: true, errorTracking: true })
}

/**
 * Reject all optional consent categories (only necessary remains)
 */
export const rejectAll = (): ConsentState => {
  return setConsent({ analytics: false, errorTracking: false })
}

/**
 * Clear stored consent (for testing or user request)
 */
export const clearConsent = (): void => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}
