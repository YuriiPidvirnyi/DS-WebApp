import type { Metadata } from 'next'
import Gallery from '@/pages/Gallery'
import { generateBreadcrumbSchema } from '@/utils/seo'

export const metadata: Metadata = {
  title: 'Галерея робіт — Результати лікування Dental Story',
  description:
    'Портфоліо наших робіт: фото до і після лікування. Імплантація, реставрація, відбілювання зубів.',
  keywords:
    'результати лікування зубів, фото до і після, dental story портфоліо',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Галерея робіт Dental Story',
    description:
      'Портфоліо наших робіт: фото до і після лікування.',
    url: '/gallery',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Галерея', url: 'https://dentalstory.com.ua/gallery' },
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
