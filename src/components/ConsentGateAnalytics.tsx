'use client'

import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { getStoredConsentState } from '@/utils/cookieConsent'

/**
 * Renders Vercel Analytics only when the user has accepted cookies.
 * Listens for same-tab consent decisions via the `consentChanged` custom event
 * and for cross-tab decisions via the `storage` event.
 */
export default function ConsentGateAnalytics() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    const update = () => setConsented(getStoredConsentState() === 'accepted')
    update()
    window.addEventListener('storage', update)
    window.addEventListener('consentChanged', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('consentChanged', update)
    }
  }, [])

  if (!consented) return null
  return <Analytics />
}
