'use client'

/**
 * I18n Provider for Next.js App Router.
 *
 * Importing src/i18n/config triggers the i18next.init() call client-side.
 * I18nextProvider then makes the instance available to all useTranslation()
 * calls in the component tree.
 *
 * Language is applied AFTER hydration via initializeI18nFromStorage() so
 * lazy en/pl bundles are loaded before changeLanguage (avoids raw keys).
 */
import { type ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { initializeI18nFromStorage } from '@/i18n/config'

interface I18nProviderProps {
  children: ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    void initializeI18nFromStorage()
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
