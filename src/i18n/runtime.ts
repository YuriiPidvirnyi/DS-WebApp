'use client'

/**
 * Instance-scoped i18n runtime helpers.
 *
 * The app creates a fresh i18next instance per request (see
 * app/i18n-provider.tsx), so all language operations act on an explicit
 * instance instead of the module-global singleton from ./config.
 */
import i18next, { type i18n as I18nInstance, type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import ukTranslations from '@/locales/uk'

export type SupportedLocale = 'uk' | 'en' | 'pl'

const LAZY_BUNDLE_LOADERS: Record<
  'en' | 'pl',
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import('@/locales/en'),
  pl: () => import('@/locales/pl'),
}

export function normalizeLocale(
  value: string | null | undefined
): SupportedLocale | null {
  if (!value) return null
  const lng = value.toLowerCase().split('-')[0]
  return lng === 'uk' || lng === 'en' || lng === 'pl' ? lng : null
}

/** Load a locale bundle into an instance (no-op when already present). */
export async function ensureBundle(
  instance: I18nInstance,
  lng: SupportedLocale
): Promise<void> {
  if (lng === 'uk' || instance.hasResourceBundle(lng, 'translation')) return
  const mod = await LAZY_BUNDLE_LOADERS[lng]()
  instance.addResourceBundle(lng, 'translation', mod.default, true, true)
}

/** Switch language on an instance, lazy-loading its bundle and persisting. */
export async function switchLanguage(
  instance: I18nInstance,
  lng: SupportedLocale
): Promise<void> {
  await ensureBundle(instance, lng)
  await instance.changeLanguage(lng)
  try {
    localStorage.setItem('i18nextLng', lng)
  } catch {
    // storage may be unavailable (private mode)
  }
}

/**
 * Create a per-request i18next instance. For non-uk locales the caller
 * passes the pre-loaded bundle so SSR output is translated synchronously.
 */
export function createRequestI18n(
  locale: SupportedLocale,
  bundle: Record<string, unknown> | null
): I18nInstance {
  const instance = i18next.createInstance()
  const resources: Resource = {
    uk: { translation: ukTranslations },
  }
  if (locale !== 'uk' && bundle) {
    resources[locale] = { translation: bundle }
  }

  instance.use(initReactI18next).init({
    resources,
    lng: locale !== 'uk' && !bundle ? 'uk' : locale,
    fallbackLng: 'uk',
    supportedLngs: ['uk', 'en', 'pl'],
    interpolation: { escapeValue: false },
    // Synchronous init so translations exist before React hydrates the tree
    // (i18next v26 renamed initImmediate -> initAsync)
    initAsync: false,
    defaultNS: 'translation',
    react: { useSuspense: false },
  })
  return instance
}
