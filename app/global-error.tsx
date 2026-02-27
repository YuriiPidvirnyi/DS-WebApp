'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary for React render errors in the App Router.
 * Required by @sentry/nextjs for capturing errors from Server Components.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <html lang="uk">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f9fafb',
          }}
        >
          <div style={{ maxWidth: '32rem' }}>
            {/* Error Icon */}
            <svg
              style={{ width: '5rem', height: '5rem', margin: '0 auto 1.5rem', color: '#ef4444' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827' }}>
              Критична помилка
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.125rem' }}>
              На жаль, виникла серйозна помилка. Ми працюємо над її виправленням.
            </p>

            {isDev && error.message && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                }}
              >
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#b91c1c' }}>
                  Технічна інформація
                </summary>
                <pre
                  style={{
                    fontSize: '0.75rem',
                    color: '#991b1b',
                    overflow: 'auto',
                    maxHeight: '8rem',
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                </pre>
                {error.digest && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
                    Digest: {error.digest}
                  </p>
                )}
              </details>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.875rem 2rem',
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0f766e')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
              >
                Спробувати ще раз
              </button>

              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.875rem 2rem',
                  background: 'white',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                На головну
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
