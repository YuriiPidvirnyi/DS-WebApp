'use client'

import { useEffect } from 'react'
import { Calendar, AlertCircle, RefreshCw, Phone, Home } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'
import { CLINIC_PHONE } from '@/utils/constants'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BookingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      captureException(error, { context: 'booking', digest: error.digest })
    }
    console.error('Booking error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <Calendar
            className="h-20 w-20 text-dental-teal"
            aria-hidden="true"
          />
          <AlertCircle
            className="h-8 w-8 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full"
            aria-hidden="true"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Помилка при бронюванні
        </h1>
        <p className="text-gray-600 mb-6">
          На жаль, виникла помилка при завантаженні форми запису. Будь ласка, спробуйте ще раз або зателефонуйте нам напряму.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 text-left">
            <details className="border border-gray-300 rounded-md p-4">
              <summary className="cursor-pointer text-sm text-gray-700 font-medium">
                Технічна інформація
              </summary>
              <pre className="text-xs bg-red-50 p-3 rounded-md text-red-800 overflow-auto max-h-32 mt-2">
                {error.message}
              </pre>
            </details>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-teal text-white font-semibold rounded-lg hover:bg-dental-teal/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Спробувати ще раз
          </button>

          <a
            href={`tel:${CLINIC_PHONE.replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="h-4 w-4 mr-2" />
            Зателефонувати: {CLINIC_PHONE}
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            На головну
          </Link>
        </div>
      </div>
    </div>
  )
}
