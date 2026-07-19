'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'
import i18n from '@/i18n/config'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CabinetError({ error, reset }: ErrorProps) {
  const t = i18n.t.bind(i18n)

  useEffect(() => {
    captureException(error, {
      tags: {
        context: 'cabinet',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="flex items-center justify-center p-4 min-h-[60vh]">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-status-error-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-dental-error" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dental-dark mb-2">
            {t('cabinet.error.title', {
              defaultValue: 'Щось пішло не так',
            })}
          </h1>
          <p className="text-dental-muted mb-4">
            {t('cabinet.error.description', {
              defaultValue:
                'Виникла помилка при завантаженні сторінки. Спробуйте оновити або поверніться на головну.',
            })}
          </p>
          {error.digest && (
            <p className="text-xs text-dental-muted font-mono bg-dental-secondary-50 px-3 py-2 rounded-lg break-all border border-dental-secondary-100">
              {t('errors.common.errorId')}: {error.digest}
            </p>
          )}
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-4 bg-status-warning-100 rounded-xl border border-dental-warning/30">
            <p className="text-sm font-semibold text-status-warning-700 mb-2">
              {t('cabinet.error.devDetails', {
                defaultValue: 'Деталі помилки (розробка):',
              })}
            </p>
            <pre className="text-xs text-dental-dark bg-white p-3 rounded-lg overflow-auto max-h-32 border border-dental-warning/30 font-mono">
              {error.message}
            </pre>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('cabinet.error.retry', {
              defaultValue: 'Спробувати ще раз',
            })}
          </button>
          <Link
            href="/cabinet"
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-dental-secondary-50 text-dental-primary-ink px-6 py-3 rounded-xl font-medium border border-dental-secondary-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('cabinet.error.goHome', {
              defaultValue: 'На головну кабінету',
            })}
          </Link>
        </div>
      </div>
    </div>
  )
}
