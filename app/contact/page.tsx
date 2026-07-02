import type { Metadata } from 'next'
import Contact from '@/views/Contact'
import { generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'
import { hreflangAlternates } from '@/utils/locale-alternates'

const contactMeta = uk.routeMeta.contact

export const metadata: Metadata = {
  title: contactMeta.title,
  description: contactMeta.description,
  keywords: contactMeta.keywords,
  alternates: {
    canonical: '/contact',
    languages: hreflangAlternates('/contact'),
  },
  openGraph: {
    title: contactMeta.openGraphTitle,
    description: contactMeta.openGraphDescription,
    url: '/contact',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.ua/' },
  { name: contactMeta.breadcrumb, url: 'https://dentalstory.ua/contact' },
])

export default function ContactPage() {
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
