import type { Metadata } from 'next'
import About from '@/views/About'
import { generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'

const aboutMeta = uk.routeMeta.about

export const metadata: Metadata = {
  title: aboutMeta.title,
  description: aboutMeta.description,
  keywords: aboutMeta.keywords,
  alternates: { canonical: '/about' },
  openGraph: {
    title: aboutMeta.openGraphTitle,
    description: aboutMeta.openGraphDescription,
    url: '/about',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.com.ua/' },
  { name: aboutMeta.breadcrumb, url: 'https://dentalstory.com.ua/about' },
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
