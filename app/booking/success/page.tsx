import type { Metadata } from 'next'
import { Suspense } from 'react'
import BookingSuccess from '@/views/BookingSuccess'

export const metadata: Metadata = {
  title: 'Запис створено — Dental Story',
  description:
    "Дякуємо! Ми зв'яжемося для підтвердження запису. Додайте подію в календар та увімкніть нагадування.",
  alternates: { canonical: '/booking/success' },
}

export default function BookingSuccessPage() {
  return (
    <Suspense>
      <BookingSuccess />
    </Suspense>
  )
}
