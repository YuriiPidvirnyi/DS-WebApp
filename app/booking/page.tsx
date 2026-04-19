import type { Metadata } from 'next'
import Booking from '@/views/Booking'
import { generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'

const bookingMeta = uk.routeMeta.booking

export const metadata: Metadata = {
  title: bookingMeta.title,
  description: bookingMeta.description,
  keywords: bookingMeta.keywords,
  alternates: { canonical: '/booking' },
  openGraph: {
    title: bookingMeta.openGraphTitle,
    description: bookingMeta.openGraphDescription,
    url: '/booking',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: uk.navigation.home, url: 'https://dentalstory.ua/' },
  { name: bookingMeta.breadcrumb, url: 'https://dentalstory.ua/booking' },
])

export default function BookingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Booking />
    </>
  )
}
