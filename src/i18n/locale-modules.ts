/**
 * Server-side access to en/pl locale modules for metadata and JSON-LD.
 * (uk pages import '@/locales/uk' directly, as before.)
 */
import en from '@/locales/en'
import pl from '@/locales/pl'

export type UrlLocale = 'en' | 'pl'

export const URL_LOCALES: UrlLocale[] = ['en', 'pl']

export const LOCALE_MODULES = { en, pl }

export function isUrlLocale(value: string): value is UrlLocale {
  return value === 'en' || value === 'pl'
}
