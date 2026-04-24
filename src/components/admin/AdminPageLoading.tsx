'use client'

import { useTranslation } from 'react-i18next'

/**
 * Shared loading state for admin route pages.
 * Fits inside AdminLayoutClient's main content area (no min-h-screen).
 */
export default function AdminPageLoading() {
  const { t } = useTranslation()
  return (
    <div
      className="flex items-center justify-center py-24"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t('common.loading')}...</span>
      <div
        className="w-12 h-12 rounded-full border-4 border-dental-primary-600 border-t-transparent animate-spin"
        aria-hidden="true"
      />
    </div>
  )
}
