'use client'

/**
 * I18n Provider for Next.js App Router with URL-locale support.
 *
 * A fresh i18next instance is created per provider mount (= per request on
 * the server via the useState initializer), so concurrent SSR requests for
 * different locales never race on a shared global instance.
 *
 * - locale 'uk' (default): only the Ukrainian bundle ships; a stored en/pl
 *   preference is applied AFTER hydration with lazy bundle loading (legacy
 *   behavior for non-localized routes).
 * - locale 'en'/'pl' (URL-prefixed trees): the server layout passes the
 *   matching bundle so the very first SSR paint is already translated; the
 *   URL choice is persisted to localStorage.
 */
import { type ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { I18nextProvider } from 'react-i18next'
import {
  createRequestI18n,
  normalizeLocale,
  switchLanguage,
  type SupportedLocale,
} from '@/i18n/runtime'
// Module-global instance still consumed by non-React helpers (toasts, error
// pages, admin utils via `import i18n from '@/i18n/config'`).
import { setLanguage as syncGlobalLanguage } from '@/i18n/config'

export type { SupportedLocale }

interface I18nProviderProps {
  locale?: SupportedLocale
  /** Pre-loaded bundle for non-uk locales (passed from the server layout). */
  localeBundle?: Record<string, unknown> | null
  children: ReactNode
}

export default function I18nProvider({
  locale = 'uk',
  localeBundle = null,
  children,
}: I18nProviderProps) {
  const [instance] = useState(() => createRequestI18n(locale, localeBundle))
  const pathname = usePathname()

  // Keep the module-global instance in lockstep with the request instance
  // so non-React consumers translate in the active language too.
  useEffect(() => {
    const mirror = (lng: string) => {
      void syncGlobalLanguage(lng)
    }
    instance.on('languageChanged', mirror)
    if (locale !== 'uk') mirror(locale)
    return () => {
      instance.off('languageChanged', mirror)
    }
  }, [instance, locale])

  // Resolve the active language after hydration and on every client-side
  // navigation. The root layout (and this provider) persists across soft
  // navigations, so the URL prefix must be re-read from the pathname:
  // /en, /pl → URL locale wins and is persisted; uk-root URLs → the stored
  // preference applies (legacy behavior for non-localized routes).
  useEffect(() => {
    const urlLocale =
      pathname === '/en' || pathname?.startsWith('/en/')
        ? ('en' as const)
        : pathname === '/pl' || pathname?.startsWith('/pl/')
          ? ('pl' as const)
          : null

    let stored: SupportedLocale | null = null
    try {
      stored = normalizeLocale(localStorage.getItem('i18nextLng'))
      if (urlLocale) localStorage.setItem('i18nextLng', urlLocale)
    } catch {
      // storage may be unavailable
    }

    const target = urlLocale ?? stored ?? 'uk'
    if (instance.language !== target) {
      void switchLanguage(instance, target)
    }
    document.documentElement.lang = target
  }, [instance, pathname])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
