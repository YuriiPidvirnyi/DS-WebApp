'use client'

import { useEffect, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { CONTACT_INFO } from '@/utils/constants'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const COLORS = {
  bg: '#F8F9FA',
  navy: '#2C3E42',
  text: '#4A5E63',
  teal: '#3f6f79',
  tealHover: '#335d66',
  white: '#FFFFFF',
  border: '#E5E7EB',
  red: '#EF4444',
  redBg: '#FEF2F2',
}

// global-error replaces the ROOT layout, so there is no i18n provider (nor
// Tailwind/globals.css) in scope here — that's why the styles are inline hex.
// We keep this page deliberately dependency-free (it must render even when the
// app infra, i18n included, is what broke), so instead of the i18next runtime
// we localize via a tiny self-contained dictionary keyed off the persisted
// language. Copy is intentionally duplicated here rather than pulled from the
// lazy-loaded locale bundles, to avoid depending on that machinery.
type Lang = 'uk' | 'en' | 'pl'
const COPY: Record<
  Lang,
  {
    htmlTitle: string
    title: string
    body: string
    codeLabel: string
    retry: string
    home: string
    help: string
  }
> = {
  uk: {
    htmlTitle: 'DentalStory — помилка',
    title: 'Щось пішло не так',
    body: 'Виникла критична помилка. Спробуйте перезавантажити сторінку або поверніться на головну.',
    codeLabel: 'Код',
    retry: 'Спробувати знову',
    home: 'На головну',
    help: 'Потрібна допомога?',
  },
  en: {
    htmlTitle: 'DentalStory — error',
    title: 'Something went wrong',
    body: 'A critical error occurred. Try reloading the page or return to the homepage.',
    codeLabel: 'Code',
    retry: 'Try again',
    home: 'Go to homepage',
    help: 'Need help?',
  },
  pl: {
    htmlTitle: 'DentalStory — błąd',
    title: 'Coś poszło nie tak',
    body: 'Wystąpił błąd krytyczny. Spróbuj odświeżyć stronę lub wróć na stronę główną.',
    codeLabel: 'Kod',
    retry: 'Spróbuj ponownie',
    home: 'Strona główna',
    help: 'Potrzebujesz pomocy?',
  },
}

// Mirror the app's persisted-language key ('i18nextLng'); client-only, so any
// failure (SSR, privacy mode) safely falls back to the Ukrainian default.
function readLang(): Lang {
  try {
    const raw = localStorage.getItem('i18nextLng')?.slice(0, 2)
    if (raw === 'en' || raw === 'pl') return raw
  } catch {
    // localStorage unavailable — keep the default.
  }
  return 'uk'
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // SSR / first paint render the uk default (localStorage is client-only), then
  // the effect swaps in the visitor's stored language — no hydration mismatch.
  const [lang, setLang] = useState<Lang>('uk')

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'global', critical: 'true' },
      extra: { digest: error.digest },
    })
  }, [error])

  useEffect(() => {
    setLang(readLang())
  }, [])

  const t = COPY[lang]

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{t.htmlTitle}</title>
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
            {t.title}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: COLORS.text,
              margin: '0 0 24px',
              lineHeight: 1.6,
            }}
          >
            {t.body}
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
                {t.codeLabel}: {error.digest}
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
              {t.retry}
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
              {t.home}
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
              {t.help}{' '}
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                style={{ color: COLORS.teal, fontWeight: 600 }}
              >
                {CONTACT_INFO.email}
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
