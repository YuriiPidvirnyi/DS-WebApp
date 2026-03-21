export const COOKIE_CONSENT_KEY = 'cookie_consent'

export type ConsentState = 'pending' | 'accepted' | 'declined'

export function getStoredConsentState(): ConsentState {
  if (typeof window === 'undefined') return 'pending'
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
  if (stored === 'accepted' || stored === 'declined') return stored
  return 'pending'
}

export function setStoredConsentState(
  state: Exclude<ConsentState, 'pending'>
): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COOKIE_CONSENT_KEY, state)
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
}
