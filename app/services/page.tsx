import type { Metadata } from 'next'
import Services from '@/views/Services'
import { generateFAQSchema, generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'
import { hreflangAlternates } from '@/utils/locale-alternates'

const servicesMeta = uk.routeMeta.services

export const metadata: Metadata = {
  title: servicesMeta.title,
  description: servicesMeta.description,
  keywords: servicesMeta.keywords,
  alternates: {
    canonical: '/services',
    languages: hreflangAlternates('/services'),
  },
  openGraph: {
    title: servicesMeta.openGraphTitle,
    description: servicesMeta.openGraphDescription,
    url: '/services',
  },
}

// Flatten FAQ items from locale for schema
const allFaqItems: Array<{ question: string; answer: string }> = [
  ...Object.values(uk.servicesFaq.general.items),
  ...Object.values(uk.servicesFaq.services.items),
  ...Object.values(uk.servicesFaq.hygiene.items),
]

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.ua/' },
  { name: servicesMeta.breadcrumb, url: 'https://dentalstory.ua/services' },
])

export default function ServicesPage() {
  const faqSchema = generateFAQSchema(allFaqItems)
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
