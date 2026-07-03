import { notFound } from 'next/navigation'
import { isUrlLocale, URL_LOCALES } from '@/i18n/locale-modules'

/**
 * URL-locale segment (/en, /pl). The actual i18n wiring lives in the root
 * layout: proxy.ts injects an x-locale request header, the root layout loads
 * the matching bundle and hands it to the per-request I18nProvider, so the
 * whole page — including site chrome — renders in the URL language.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return URL_LOCALES.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isUrlLocale(locale)) notFound()
  return children
}
