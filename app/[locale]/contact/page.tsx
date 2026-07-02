import type { Metadata } from 'next'
import Contact from '@/views/Contact'
import { generateBreadcrumbSchema } from '@/utils/seo'
import { isUrlLocale, LOCALE_MODULES } from '@/i18n/locale-modules'
import { hreflangAlternates, OG_LOCALE } from '@/utils/locale-alternates'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isUrlLocale(locale)) return {}
  const meta = LOCALE_MODULES[locale].routeMeta.contact
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: hreflangAlternates('/contact'),
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.openGraphDescription,
      url: `/${locale}/contact`,
      locale: OG_LOCALE[locale],
    },
  }
}

export default async function LocaleContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const m = LOCALE_MODULES[locale as 'en' | 'pl']
  const breadcrumb = generateBreadcrumbSchema([
    { name: m.navigation.home, url: `${BASE_URL}/${locale}` },
    {
      name: m.routeMeta.contact.breadcrumb,
      url: `${BASE_URL}/${locale}/contact`,
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Contact />
    </>
  )
}
