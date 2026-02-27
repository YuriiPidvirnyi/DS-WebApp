'use client'

/**
 * I18n Provider for Next.js App Router.
 *
 * Importing src/i18n/config triggers the i18next.init() call client-side.
 * I18nextProvider then makes the instance available to all useTranslation()
 * calls in the component tree.
 *
 * Language detection order: localStorage → navigator → htmlTag
 * (configured in src/i18n/config.ts via i18next-browser-languagedetector)
 */
import { type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'

interface I18nProviderProps {
  children: ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
