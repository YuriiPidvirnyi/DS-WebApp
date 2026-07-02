import type { Metadata } from 'next'
import Gallery from '@/views/Gallery'
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
  const meta = LOCALE_MODULES[locale].routeMeta.gallery
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${locale}/gallery`,
      languages: hreflangAlternates('/gallery'),
    },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.openGraphDescription,
      url: `/${locale}/gallery`,
      locale: OG_LOCALE[locale],
    },
  }
}

export default async function LocaleGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const m = LOCALE_MODULES[locale as 'en' | 'pl']
  const breadcrumb = generateBreadcrumbSchema([
    { name: m.navigation.home, url: `${BASE_URL}/${locale}` },
    {
      name: m.routeMeta.gallery.breadcrumb,
      url: `${BASE_URL}/${locale}/gallery`,
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Gallery />
    </>
  )
}
