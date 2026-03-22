'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const COLORS = {
  bg: '#F8F9FA',
  navy: '#2C3E42',
  text: '#4A5E63',
  teal: '#5A8A94',
  tealHover: '#4A7A84',
  white: '#FFFFFF',
  border: '#E5E7EB',
  red: '#EF4444',
  redBg: '#FEF2F2',
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'global', critical: 'true' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <html lang="uk">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DentalStory — помилка</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: COLORS.bg,
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            padding: '24px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: COLORS.red,
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={COLORS.white}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.navy,
              margin: '0 0 12px',
            }}
          >
            Щось пішло не так
          </h1>
          <p
            style={{
              fontSize: 15,
              color: COLORS.text,
              margin: '0 0 24px',
              lineHeight: 1.6,
            }}
          >
            Виникла критична помилка. Спробуйте перезавантажити сторінку або
            поверніться на головну.
          </p>

          {error.digest && (
            <div
              style={{
                marginBottom: 24,
                padding: '12px 16px',
                backgroundColor: COLORS.white,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: COLORS.text,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                Код: {error.digest}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: '14px 24px',
                backgroundColor: COLORS.teal,
                color: COLORS.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Спробувати знову
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside root layout, <Link> unavailable */}
            <a
              href="/"
              style={{
                display: 'block',
                padding: '14px 24px',
                backgroundColor: COLORS.white,
                color: COLORS.teal,
                border: `2px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              На головну
            </a>
          </div>

          <div
            style={{
              marginTop: 32,
              padding: '14px 16px',
              backgroundColor: COLORS.white,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: COLORS.text }}>
              Потрібна допомога?{' '}
              <a
                href="mailto:support@dentalstory.ua"
                style={{ color: COLORS.teal, fontWeight: 600 }}
              >
                support@dentalstory.ua
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
