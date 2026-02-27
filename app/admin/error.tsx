'use client'

import { useEffect } from 'react'
import { Shield, AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import Link from 'next/link'
import { captureException } from '@/utils/sentry'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      captureException(error, { context: 'admin', digest: error.digest })
    }
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="max-w-lg bg-white rounded-xl shadow-lg p-8">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <Shield
            className="h-20 w-20 text-gray-400"
            aria-hidden="true"
          />
          <AlertCircle
            className="h-8 w-8 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full"
            aria-hidden="true"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Помилка адмін-панелі
        </h1>
        <p className="text-gray-600 mb-6">
          Виникла помилка в адміністративній панелі. Спробуйте оновити сторінку або увійти знову.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 text-left">
            <details className="border border-red-200 rounded-md p-4 bg-red-50">
              <summary className="cursor-pointer text-sm text-red-700 font-medium">
                Технічна інформація
              </summary>
              <pre className="text-xs text-red-800 overflow-auto max-h-32 mt-2">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
              )}
            </details>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-teal text-white font-semibold rounded-lg hover:bg-dental-teal/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити сторінку
          </button>

          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Увійти знову
          </Link>

          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Повернутися на сайт
          </Link>
        </div>
      </div>
    </div>
  )
}
