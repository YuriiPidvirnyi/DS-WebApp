import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { hasConsented, acceptAll, rejectAll, setConsent } from '@/utils/consent'
import { initializeAnalytics } from '@/utils/analytics'
import { initializeSentry } from '@/utils/sentry'

/**
 * GDPR-compliant cookie consent banner
 * Gates analytics (GA4) and error tracking (Sentry) behind user consent
 */
const CookieConsent = () => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => !hasConsented())
  const [showCustomize, setShowCustomize] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [errorTrackingEnabled, setErrorTrackingEnabled] = useState(false)

  const initializeServices = useCallback(
    (analytics: boolean, errorTracking: boolean) => {
      if (analytics) {
        initializeAnalytics()
      }
      if (errorTracking && process.env.NODE_ENV === 'production') {
        initializeSentry()
      }
    },
    []
  )

  const handleAcceptAll = useCallback(() => {
    acceptAll()
    initializeServices(true, true)
    setVisible(false)
  }, [initializeServices])

  const handleRejectAll = useCallback(() => {
    rejectAll()
    setVisible(false)
  }, [])

  const handleSaveCustom = useCallback(() => {
    setConsent({
      analytics: analyticsEnabled,
      errorTracking: errorTrackingEnabled,
    })
    initializeServices(analyticsEnabled, errorTrackingEnabled)
    setVisible(false)
  }, [analyticsEnabled, errorTrackingEnabled, initializeServices])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('cookieConsent.title')}
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-card shadow-2xl border border-border">
        <div className="p-5 md:p-6">
          {/* Header */}
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t('cookieConsent.title')}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {t('cookieConsent.description')}{' '}
            <a
              href="/privacy-policy"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              {t('cookieConsent.privacyPolicyLink')}
            </a>
          </p>

          {/* Customize panel */}
          {showCustomize && (
            <div className="mb-4 space-y-3 rounded-xl bg-muted p-4">
              {/* Necessary cookies — always on */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('cookieConsent.categories.necessary.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.categories.necessary.description')}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground select-none px-2 py-1">
                  {t('cookieConsent.alwaysOn')}
                </span>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('cookieConsent.categories.analytics.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.categories.analytics.description')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsEnabled}
                  aria-label={t('cookieConsent.categories.analytics.title')}
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    analyticsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Error tracking */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('cookieConsent.categories.errorTracking.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('cookieConsent.categories.errorTracking.description')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={errorTrackingEnabled}
                  aria-label={t('cookieConsent.categories.errorTracking.title')}
                  onClick={() => setErrorTrackingEnabled(!errorTrackingEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    errorTrackingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      errorTrackingEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {showCustomize ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
              >
                {t('cookieConsent.savePreferences')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                >
                  {t('cookieConsent.acceptAll')}
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
                >
                  {t('cookieConsent.rejectAll')}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
            >
              {showCustomize
                ? t('cookieConsent.hideCustomize')
                : t('cookieConsent.customize')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
