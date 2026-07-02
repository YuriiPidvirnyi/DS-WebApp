'use client'

import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { AsyncState } from '@/components/ui'
import { Card } from '@/components/ui'
import i18n from '@/i18n/config'

// Dynamically import heavy BookingForm component with loading fallback
const BookingForm = dynamic(() => import('@/components/BookingForm'), {
  loading: () => (
    <AsyncState
      variant="loading"
      title={i18n.t('booking.loading.formTitle')}
      message={i18n.t('booking.loading.preparingMessage')}
      className="bg-white shadow-xs"
    />
  ),
  ssr: false, // Prevent hydration mismatch with form hooks
})

export default function BookingPage() {
  const { t } = useTranslation()

  return (
    <div className="py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-4">
            {t('booking.title')}
          </h1>
          <p className="text-lg text-dental-muted">{t('booking.subtitle')}</p>
        </div>
        <Card variant="elevated" padding="lg">
          <Suspense
            fallback={
              <AsyncState
                variant="loading"
                title={t('booking.loading.formTitle')}
                message={t('booking.loading.stepsMessage')}
                className="bg-white shadow-xs"
              />
            }
          >
            <BookingForm />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}
