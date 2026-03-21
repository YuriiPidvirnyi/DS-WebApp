'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import i18n from '@/i18n/config'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const t = i18n.t.bind(i18n)

  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
        critical: 'true',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <html lang={i18n.language || 'uk'} className="scroll-smooth">
      <body className="bg-dental-error-light">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Critical Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-dental-error rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-dental-dark mb-4">
              {t('errors.global.title')}
            </h1>
            <p className="text-dental-muted mb-6 leading-relaxed">
              {t('errors.global.description')}
            </p>

            {error.digest && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-dental-error-light">
                <p className="text-xs text-dental-text-light font-mono break-all">
                  {t('errors.global.digestLabel')}: {error.digest}
                </p>
              </div>
            )}

            {/* Dev Info */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mb-6 p-4 bg-dental-warning-light rounded-lg text-left border border-dental-warning">
                <p className="text-sm font-bold text-dental-warning mb-2">
                  {t('errors.global.devDetails')}
                </p>
                <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-32 text-dental-text border border-dental-warning font-mono">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('errors.global.retry')}
              </button>
              <Link
                href="/"
                className="block px-6 py-3 bg-white hover:bg-dental-primary-50 text-dental-primary-600 font-semibold rounded-lg border-2 border-dental-primary-200 transition-colors"
              >
                {t('errors.global.goHome')}
              </Link>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-white rounded-lg border border-dental-secondary-200">
              <p className="text-sm text-dental-muted">
                {t('errors.global.supportPrompt')}{' '}
                <a
                  href="mailto:support@dentalstory.ua"
                  className="font-semibold text-dental-primary-600 hover:underline"
                >
                  {t('errors.global.supportLink')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
