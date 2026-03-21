import type { Metadata } from 'next'
import { Suspense } from 'react'
import BookingSuccess from '@/views/BookingSuccess'
import uk from '@/locales/uk'

const bookingSuccessMeta = uk.routeMeta.bookingSuccess

export const metadata: Metadata = {
  title: bookingSuccessMeta.title,
  description: bookingSuccessMeta.description,
  alternates: { canonical: '/booking/success' },
}

export default function BookingSuccessPage() {
  return (
    <Suspense>
      <BookingSuccess />
    </Suspense>
  )
}
