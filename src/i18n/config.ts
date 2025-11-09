import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import ukTranslations from '../locales/uk.json'
import enTranslations from '../locales/en.json'
import plTranslations from '../locales/pl.json'

// Resources for i18n
const resources = {
  uk: {
    translation: ukTranslations,
  },
  en: {
    translation: enTranslations,
  },
  pl: {
    translation: plTranslations,
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

export default i18n
