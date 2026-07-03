import type { Metadata } from 'next'
import Home from '@/views/Home'
import { getVariant } from '@/lib/ab-test'
import { isUrlLocale, LOCALE_MODULES } from '@/i18n/locale-modules'
import { hreflangAlternates, OG_LOCALE } from '@/utils/locale-alternates'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isUrlLocale(locale)) return {}
  const meta = LOCALE_MODULES[locale].routeMeta.home
  return {
    // Home titles already contain the brand — bypass the layout template
    title: { absolute: meta.title },
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: hreflangAlternates('/'),
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.openGraphDescription,
      url: `/${locale}`,
      locale: OG_LOCALE[locale],
    },
  }
}

export default async function LocaleHomePage() {
  const heroCTAVariant = await getVariant('hero-cta')
  return <Home heroCTAVariant={heroCTAVariant} />
}
