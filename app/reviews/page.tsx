import type { Metadata } from 'next'
import Reviews from '@/pages/Reviews'
import { generateBreadcrumbSchema } from '@/utils/seo'

export const metadata: Metadata = {
  title: 'Відгуки пацієнтів — Dental Story',
  description:
    'Оцініть наш сервіс та прочитайте відгуки пацієнтів про лікування у Dental Story.',
  keywords: 'відгуки стоматології, dental story відгуки, лікування зубів львів',
  alternates: { canonical: '/reviews' },
  openGraph: {
    title: 'Відгуки пацієнтів Dental Story',
    description:
      'Оцініть наш сервіс та прочитайте відгуки пацієнтів.',
    url: '/reviews',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Відгуки', url: 'https://dentalstory.com.ua/reviews' },
])

export default function ReviewsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Reviews />
    </>
  )
}
