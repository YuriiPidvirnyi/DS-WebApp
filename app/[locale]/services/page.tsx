import type { Metadata } from 'next'
import Services from '@/views/Services'
import { generateFAQSchema, generateBreadcrumbSchema } from '@/utils/seo'
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
  const meta = LOCALE_MODULES[locale].routeMeta.services
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${locale}/services`,
      languages: hreflangAlternates('/services'),
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.openGraphDescription,
      url: `/${locale}/services`,
      locale: OG_LOCALE[locale],
    },
  }
}

export default async function LocaleServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const m = LOCALE_MODULES[locale as 'en' | 'pl']

  const faqSchema = generateFAQSchema([
    ...Object.values(m.servicesFaq.general.items),
    ...Object.values(m.servicesFaq.services.items),
    ...Object.values(m.servicesFaq.hygiene.items),
  ])
  const breadcrumb = generateBreadcrumbSchema([
    { name: m.navigation.home, url: `${BASE_URL}/${locale}` },
    {
      name: m.routeMeta.services.breadcrumb,
      url: `${BASE_URL}/${locale}/services`,
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Services />
    </>
  )
}
