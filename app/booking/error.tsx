'use client'

import { useEffect } from 'react'
import { Calendar, AlertCircle, RotateCcw, Phone, Home } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'
import { CONTACT_INFO } from '@/utils/constants'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BookingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    captureException(error, {
      tags: {
        context: 'booking',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <Calendar
            className="h-20 w-20 text-dental-primary-500"
            aria-hidden="true"
          />
          <AlertCircle
            className="h-8 w-8 text-dental-error absolute -bottom-1 -right-1 bg-white rounded-full"
            aria-hidden="true"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-dental-dark mb-2">
          Помилка при бронюванні
        </h1>
        <p className="text-dental-muted mb-6">
          На жаль, виникла помилка при завантаженні форми запису. Будь ласка, спробуйте ще раз або зв'яжіться з нами напряму.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 text-left">
            <details className="border border-dental-warning rounded-md p-4 bg-dental-warning-light">
              <summary className="cursor-pointer text-sm text-dental-warning font-medium">
                Технічна інформація
              </summary>
              <pre className="text-xs bg-white p-3 rounded-md text-dental-text overflow-auto max-h-32 mt-2 border border-dental-warning font-mono">
                {error.message}
              </pre>
            </details>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Спробувати ще раз
          </button>

          <a
            href={`tel:${CONTACT_INFO.phoneRaw}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-success hover:bg-dental-success text-white font-semibold rounded-lg transition-colors"
            data-track-id="call_from_booking_error"
            data-track-category="error"
            data-track-label="booking_error_call"
          >
            <Phone className="h-4 w-4 mr-2" />
            Зателефонувати: {CONTACT_INFO.phone}
          </a>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-dental-primary-200 text-dental-primary-600 font-semibold rounded-lg hover:bg-dental-primary-50 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            На головну
          </Link>
        </div>
      </div>
    </div>
  )
}
