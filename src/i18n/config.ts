'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Eagerly load only the default language (Ukrainian) — 95%+ of visitors.
// English and Polish are lazy-loaded on demand when the user switches.
import ukTranslations from '../locales/uk.json'

// Resources — start with only Ukrainian pre-loaded
const resources = {
  uk: {
    translation: ukTranslations,
  },
}

// Initialize i18n
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'uk', // Default language
    supportedLngs: ['uk', 'en', 'pl'], // Supported languages

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

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
})

// If the detected language is not Ukrainian, load it immediately
const detectedLng = i18n.language
if (detectedLng && detectedLng !== 'uk' && lazyLocaleLoaders[detectedLng]) {
  lazyLocaleLoaders[detectedLng]().then(mod => {
    i18n.addResourceBundle(detectedLng, 'translation', mod.default, true, true)
  })
}

export default i18n
