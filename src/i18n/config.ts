'use client'

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

// Eagerly load only the default language (Ukrainian) — 95%+ of visitors.
// English and Polish are lazy-loaded on demand when the user switches.
//
// IMPORTANT: We import from uk.ts (not uk.json) because Turbopack (Next.js 16
// default bundler) aggressively tree-shakes JSON imports, stripping keys it
// considers "unused". Since i18next accesses keys dynamically at runtime via
// t('reviews.title') etc., the bundler cannot statically determine which keys
// are needed. Using a .ts module with `as const` prevents this tree-shaking.
import ukTranslations from '../locales/uk'

type SupportedLanguage = 'uk' | 'en' | 'pl'
const supportedLanguages: SupportedLanguage[] = ['uk', 'en', 'pl']

// Resources — start with only Ukrainian pre-loaded
const resources = {
  uk: {
    translation: ukTranslations,
  },
}

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined'

// Use the global i18next instance instead of createInstance().
// createInstance() + async init() causes a race condition where React hydration
// runs before init() resolves, resulting in raw translation keys on the client.
// The global instance with initImmediate:false initializes synchronously.
i18next.use(initReactI18next).init({
  resources,
  lng: 'uk',
  fallbackLng: 'uk',
  supportedLngs: supportedLanguages,

  interpolation: {
    escapeValue: false, // React already does escaping
  },

  // Critical: make init synchronous so translations are available
  // before React hydrates the component tree
  initImmediate: false,

  defaultNS: 'translation',

  react: {
    useSuspense: false,
  },
})

const i18n = i18next

// Lazy-load non-default language bundles on demand.
// This saves ~20KB from the initial client bundle.
// Lazy-loaded locales also use .ts wrappers to prevent Turbopack tree-shaking
const lazyLocaleLoaders: Partial<
  Record<SupportedLanguage, () => Promise<{ default: Record<string, unknown> }>>
> = {
  en: () => import('../locales/en'),
  pl: () => import('../locales/pl'),
}

function normalizeLanguage(
  value: string | null | undefined
): SupportedLanguage | null {
  if (!value) {
    return null
  }

  const normalized = value.toLowerCase().split('-')[0]
  return supportedLanguages.includes(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : null
}

async function ensureLanguageBundle(lng: SupportedLanguage) {
  if (lng === 'uk' || i18n.hasResourceBundle(lng, 'translation')) {
    return
  }

  const loader = lazyLocaleLoaders[lng]
  if (!loader) {
    return
  }

  const mod = await loader()
  i18n.addResourceBundle(lng, 'translation', mod.default, true, true)
}

export async function setLanguage(lng: string) {
  const normalized = normalizeLanguage(lng)
  if (!normalized) {
    await i18n.changeLanguage('uk')
    return
  }

  await ensureLanguageBundle(normalized)
  await i18n.changeLanguage(normalized)

  if (isBrowser) {
    localStorage.setItem('i18nextLng', normalized)
  }
}

i18n.on('languageChanged', async (lng: string) => {
  const normalized = normalizeLanguage(lng)

  if (!normalized) {
    await i18n.changeLanguage('uk')
    return
  }

  if (normalized !== lng) {
    await i18n.changeLanguage(normalized)
    return
  }

  if (
    normalized !== 'uk' &&
    !i18n.hasResourceBundle(normalized, 'translation')
  ) {
    const loader = lazyLocaleLoaders[normalized]
    if (loader) {
      const mod = await loader()
      i18n.addResourceBundle(normalized, 'translation', mod.default, true, true)
    }
  }

  // Persist language choice to localStorage
  if (isBrowser) {
    localStorage.setItem('i18nextLng', normalized)
  }
})

/**
 * Initialize language from localStorage AFTER hydration.
 * SSR + first paint stay on Ukrainian; we then await lazy bundles before
 * `changeLanguage`, so `t()` never resolves against a half-loaded en/pl bundle.
 */
export async function initializeI18nFromStorage(): Promise<void> {
  if (!isBrowser) return

  const storedLng = normalizeLanguage(localStorage.getItem('i18nextLng'))

  if (storedLng && storedLng !== 'uk') {
    await setLanguage(storedLng)
    return
  }

  const currentLanguage = normalizeLanguage(i18n.language)
  if (!currentLanguage) {
    await i18n.changeLanguage('uk')
    return
  }

  if (
    currentLanguage !== 'uk' &&
    !i18n.hasResourceBundle(currentLanguage, 'translation')
  ) {
    await setLanguage(currentLanguage)
  }
}

export default i18n
