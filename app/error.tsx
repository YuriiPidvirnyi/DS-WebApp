'use client'

import { useEffect } from 'react'
import { AlertCircle, Home, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report to Sentry in production
    captureException(error, {
      tags: {
        errorBoundary: 'root',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-dental-error-light rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-dental-error" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dental-dark mb-2">
            Щось пішло не так
          </h1>
          <p className="text-dental-muted mb-4">
            Виникла непередбачена помилка. Нашої команди вже повідомлено про проблему.
          </p>
          {error.digest && (
            <p className="text-xs text-dental-text-light font-mono bg-dental-primary-50 px-3 py-2 rounded-lg break-all">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Dev Info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-4 bg-dental-warning-light rounded-lg border border-dental-warning">
            <p className="text-sm font-semibold text-dental-warning mb-2">Деталі помилки (розробка):</p>
            <pre className="text-xs text-dental-text bg-white p-3 rounded overflow-auto max-h-32 border border-dental-secondary-200">
              {error.message}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Спробувати ще раз
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-dental-primary-50 text-dental-primary-600 px-6 py-3 rounded-lg font-medium border-2 border-dental-primary-200 transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            На головну
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 p-4 bg-dental-info-light rounded-lg text-center">
          <p className="text-sm text-dental-info">
            Потребує допомоги?{' '}
            <a
              href="/contact"
              className="font-semibold hover:underline text-dental-info"
            >
              Зв'яжіться з нами
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
