'use client'

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

// Eagerly load only the default language (Ukrainian) — 95%+ of visitors.
// English and Polish are lazy-loaded on demand when the user switches.
import ukTranslations from '../locales/uk.json'

// Resources — start with only Ukrainian pre-loaded
const resources = {
  uk: {
    translation: ukTranslations,
  },
}

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined'

// Create a fresh i18n instance to avoid singleton pollution between SSR requests.
// This ensures each request starts with a clean slate.
const i18n = i18next.createInstance()

// Initialize i18n WITHOUT language detector to avoid hydration mismatch.
// Language detection happens AFTER hydration in initializeLanguage().
i18n
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    lng: 'uk', // Always start with Ukrainian for consistent SSR
    fallbackLng: 'uk', // Default language
    supportedLngs: ['uk', 'en', 'pl'], // Supported languages

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Namespace
    defaultNS: 'translation',

    // React options
    react: {
      useSuspense: false, // Disable suspense mode for compatibility
    },
  })

// Lazy-load non-default language bundles on demand.
// This saves ~20KB from the initial client bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyLocaleLoaders: Record<string, () => Promise<{ default: any }>> = {
  en: () => import('../locales/en.json'),
  pl: () => import('../locales/pl.json'),
}

i18n.on('languageChanged', async (lng: string) => {
  if (lng !== 'uk' && !i18n.hasResourceBundle(lng, 'translation')) {
    const loader = lazyLocaleLoaders[lng]
    if (loader) {
      const mod = await loader()
      i18n.addResourceBundle(lng, 'translation', mod.default, true, true)
    }
  }
  // Persist language choice to localStorage
  if (isBrowser) {
    localStorage.setItem('i18nextLng', lng)
  }
})

/**
 * Initialize language detection AFTER hydration.
 * This prevents hydration mismatch by ensuring SSR and initial client render
 * both use 'uk', then we switch to the user's preferred language if they've chosen one.
 * 
 * Only respects stored language preference (localStorage), not browser language.
 * Default is always Ukrainian.
 */
export function initializeLanguage() {
  if (!isBrowser) return

  // Check localStorage for explicit language choice
  // Only load other languages if user has previously selected them
  const storedLng = localStorage.getItem('i18nextLng')
  
  if (storedLng && storedLng !== 'uk' && ['en', 'pl'].includes(storedLng)) {
    // Load the language bundle and switch only if user explicitly chose it before
    const loader = lazyLocaleLoaders[storedLng]
    if (loader) {
      loader().then(mod => {
        i18n.addResourceBundle(storedLng, 'translation', mod.default, true, true)
        i18n.changeLanguage(storedLng)
      })
    }
  }
}

export default i18n
