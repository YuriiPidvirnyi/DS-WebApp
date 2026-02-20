import type { Metadata } from 'next'
import Booking from '@/pages/Booking'
import { generateBreadcrumbSchema } from '@/utils/seo'

export const metadata: Metadata = {
  title: 'Онлайн запис до стоматолога — Dental Story',
  description:
    'Запишіться на прийом до стоматолога онлайн. Вибирайте зручний час та лікаря. Швидко та безпечно.',
  keywords: 'запис до стоматолога, онлайн запис, dental story львів',
  alternates: { canonical: '/booking' },
  openGraph: {
    title: 'Онлайн запис до стоматолога Dental Story',
    description:
      'Запишіться на прийом онлайн. Вибирайте зручний час та лікаря.',
    url: '/booking',
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: 'Головна', url: 'https://dentalstory.com.ua/' },
  { name: 'Запис на прийом', url: 'https://dentalstory.com.ua/booking' },
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
