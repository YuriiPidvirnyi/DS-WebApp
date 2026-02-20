import type { Metadata } from 'next'
import Services from '@/views/Services'
import { generateFAQSchema, generateBreadcrumbSchema } from '@/utils/seo'
import { ALL_FAQS } from '@/content/faqs'

export const metadata: Metadata = {
  title: 'Послуги стоматології Dental Story — Повний спектр',
  description:
    'Всі види стоматологічних послуг: терапія, ортопедія, імплантація, ортодонтія, дитяча стоматологія. Прозорі ціни.',
  keywords:
    'стоматологічні послуги, ціни на лікування зубів, імплантація зубів',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Послуги стоматології Dental Story',
    description:
      'Всі види стоматологічних послуг: терапія, ортопедія, імплантація, ортодонтія. Прозорі ціни.',
    url: '/services',
  },
}

// Flatten all FAQs for schema
const allFaqItems = ALL_FAQS.flatMap(cat => cat.items)

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Послуги', url: 'https://dentalstory.com.ua/services' },
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
