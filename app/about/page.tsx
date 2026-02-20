import type { Metadata } from 'next'
import About from '@/pages/About'
import { generateBreadcrumbSchema } from '@/utils/seo'

export const metadata: Metadata = {
  title: 'Про нас — Dental Story Львів',
  description:
    'Dental Story — команда професіоналів з 10-річним досвідом. Сучасне обладнання, європейські стандарти лікування.',
  keywords: 'стоматологія львів про клініку, команда dental story',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Про нас — Dental Story Львів',
    description:
      'Dental Story — команда професіоналів з 10-річним досвідом.',
    url: '/about',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Про нас', url: 'https://dentalstory.com.ua/about' },
])

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <About />
    </>
  )
}
