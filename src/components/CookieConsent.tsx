'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Cookie } from 'lucide-react'
import Link from 'next/link'
import {
  getStoredConsentState,
  setStoredConsentState,
  type ConsentState,
} from '@/utils/cookieConsent'

export default function CookieConsent() {
  const { t } = useTranslation()
  const [state, setState] = useState<ConsentState>('pending')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setState(getStoredConsentState())
  }, [])

  const handleAccept = () => {
    setStoredConsentState('accepted')
    setState('accepted')
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
    })
    window.dispatchEvent(new Event('consentChanged'))
  }

  const handleDecline = () => {
    setStoredConsentState('declined')
    setState('declined')
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    })
    window.dispatchEvent(new Event('consentChanged'))
  }

  // Don't render until mounted (SSR safety) or if already decided
  if (!mounted || state !== 'pending') return null

  return (
    <div
      role="dialog"
      aria-label={t('cookies.title')}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-dental-secondary-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie
            className="w-6 h-6 text-dental-primary-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm text-dental-dark leading-relaxed">
              {t('cookies.message')}{' '}
              <Link
                href="/privacy-policy"
                className="text-dental-primary-600 underline hover:text-dental-primary-700"
              >
                {t('cookies.privacyPolicy')}
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-dental-muted hover:text-dental-dark border border-dental-secondary-300 rounded-lg hover:bg-dental-secondary-50 transition-colors"
          >
            {t('cookies.decline')}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm text-white bg-dental-primary-700 hover:bg-dental-primary-800 rounded-lg transition-colors font-medium"
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
