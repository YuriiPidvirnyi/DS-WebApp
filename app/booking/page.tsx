import type { Metadata } from 'next'
import Booking from '@/pages/Booking'

export const metadata: Metadata = {
  title: 'Запис на прийом — Dental Story',
  description:
    'Зручний онлайн-запис до стоматолога. Оберіть послугу та залиште контакти.',
  alternates: { canonical: '/booking' },
}

export default function BookingPage() {
  return <Booking />
}
