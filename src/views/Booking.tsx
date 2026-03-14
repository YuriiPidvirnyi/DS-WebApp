'use client'

import { useTranslation } from 'react-i18next'
import BookingForm from '@/components/BookingForm'

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
        <BookingForm />
      </div>
    </div>
  )
}
