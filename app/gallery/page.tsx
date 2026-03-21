import type { Metadata } from 'next'
import Gallery from '@/views/Gallery'
import { generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'

const galleryMeta = uk.routeMeta.gallery

export const metadata: Metadata = {
  title: galleryMeta.title,
  description: galleryMeta.description,
  keywords: galleryMeta.keywords,
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: galleryMeta.openGraphTitle,
    description: galleryMeta.openGraphDescription,
    url: '/gallery',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.com.ua/' },
  { name: galleryMeta.breadcrumb, url: 'https://dentalstory.com.ua/gallery' },
])

export default function GalleryPage() {
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
