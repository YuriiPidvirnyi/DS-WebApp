import type { Metadata } from 'next'
import Contact from '@/views/Contact'
import { generateBreadcrumbSchema } from '@/utils/seo'

export const metadata: Metadata = {
  title: 'Контакти — Dental Story Львів',
  description:
    'Адреса, телефон, години роботи стоматології Dental Story у Львові. Як нас знайти, карта проїзду.',
  keywords: 'dental story адреса, телефон стоматології, контакти львів',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Контакти — Dental Story Львів',
    description:
      'Адреса, телефон, години роботи стоматології Dental Story.',
    url: '/contact',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Контакти', url: 'https://dentalstory.com.ua/contact' },
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
