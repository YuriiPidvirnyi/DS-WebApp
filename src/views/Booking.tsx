'use client'

import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import heavy BookingForm component with loading fallback
const BookingForm = dynamic(() => import('@/components/BookingForm'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="space-y-4">
        <div className="h-8 bg-gradient-to-r from-dental-primary-100 to-dental-primary-50 rounded animate-pulse" />
        <div className="h-12 bg-gradient-to-r from-dental-primary-100 to-dental-primary-50 rounded animate-pulse" />
        <div className="h-12 bg-gradient-to-r from-dental-primary-100 to-dental-primary-50 rounded animate-pulse" />
      </div>
    </div>
  ),
  ssr: false, // Prevent hydration mismatch with form hooks
})

export default function BookingPage() {
  const { t } = useTranslation()
  
  return (
    <div className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-4">
            {t('booking.title')}
          </h1>
          <p className="text-lg text-dental-muted">
            {t('booking.subtitle')}
          </p>
        </div>
        <Suspense fallback={<div className="h-96 bg-dental-primary-50 rounded animate-pulse" />}>
          <BookingForm />
        </Suspense>
      </div>
    </div>
  )
}
