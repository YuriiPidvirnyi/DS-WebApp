'use client'

import { useEffect } from 'react'
import { AlertCircle, Home, RefreshCw, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      captureException(error, { digest: error.digest })
    }
    console.error('Application error:', error)
  }, [error])

  const handleReportFeedback = () => {
    captureException(error, { userFeedback: true })
    alert('Дякуємо за повідомлення! Наша команда отримала інформацію про проблему.')
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg">
        <AlertCircle
          className="h-16 w-16 text-red-500 mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ой, щось пішло не так!
        </h1>
        <p className="text-gray-600 mb-6">
          Виникла помилка при відображенні цієї сторінки. Ми вже працюємо над її виправленням.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 text-left">
            <details className="border border-gray-300 rounded-md p-4">
              <summary className="cursor-pointer text-sm text-gray-700 font-medium">
                Технічна інформація для розробників
              </summary>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-red-600">Помилка:</h3>
                <pre className="text-xs bg-red-50 p-3 rounded-md text-red-800 overflow-auto max-h-32 mt-2">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-teal text-white font-semibold rounded-lg hover:bg-dental-teal/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Спробувати ще раз
          </button>

          {process.env.NODE_ENV === 'production' && (
            <button
              onClick={handleReportFeedback}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Повідомити про проблему
            </button>
          )}

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
