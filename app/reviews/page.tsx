import type { Metadata } from 'next'
import Reviews from '@/views/Reviews'
import { generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'

const reviewsMeta = uk.routeMeta.reviews

export const metadata: Metadata = {
  title: reviewsMeta.title,
  description: reviewsMeta.description,
  keywords: reviewsMeta.keywords,
  alternates: { canonical: '/reviews' },
  openGraph: {
    title: reviewsMeta.openGraphTitle,
    description: reviewsMeta.openGraphDescription,
    url: '/reviews',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.com.ua/' },
  { name: reviewsMeta.breadcrumb, url: 'https://dentalstory.com.ua/reviews' },
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
