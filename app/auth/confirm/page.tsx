'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import type { EmailOtpType } from '@supabase/supabase-js'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { isSafeInternalPath } from '@/utils/security'

const FALLBACK = {
  recovery: {
    title: 'Відновлення пароля',
    description:
      'Натисніть кнопку нижче, щоб підтвердити запит і встановити новий пароль.',
    submit: 'Підтвердити та продовжити',
  },
  default: {
    title: 'Підтвердження',
    description: 'Натисніть кнопку нижче, щоб підтвердити запит і продовжити.',
    submit: 'Підтвердити',
  },
  verifying: 'Перевіряємо посилання...',
  backToLogin: 'Повернутись до входу',
  requestNewLink: 'Запросити нове посилання',
  errors: {
    invalidLink: 'Посилання пошкоджене або неповне. Запросіть нове посилання.',
    unavailable: 'Сервіс тимчасово недоступний',
    generic: 'Посилання недійсне або протерміноване. Запросіть нове посилання.',
  },
}

// The default target after a successful confirmation, per link type.
const NEXT_BY_TYPE: Partial<Record<EmailOtpType, string>> = {
  recovery: '/auth/reset-password',
  invite: '/auth/reset-password',
  signup: '/cabinet',
  email: '/cabinet',
  email_change: '/cabinet',
  magiclink: '/cabinet',
}

/**
 * Click-gated email-link confirmation.
 *
 * Why a button instead of auto-verifying on load: mail clients and corporate
 * link scanners (Apple Mail preview, Outlook SafeLinks, antivirus proxies)
 * pre-fetch links with a GET, which would consume the one-time token before
 * the human clicks — leaving them with "Email link is invalid or has expired".
 * A GET here only renders a button; the token is verified exclusively on an
 * explicit user click.
 *
 * Uses verifyOtp({ token_hash }) rather than the PKCE code exchange, so the
 * link also works when opened in a different browser/device than the one that
 * requested it (the PKCE code_verifier is tied to the original browser).
 */
function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, ready } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tx = useMemo(
    () => (key: string, fallback: string) => {
      const value = t(key)
      return value && value !== key ? value : fallback
    },
    [t]
  )

  // Supabase links carry `token_hash`; `token` is the legacy param name for the
  // same value in older templates — accept both, verify via verifyOtp below.
  // Read via useSearchParams (unaffected by the URL scrub below).
  const tokenHash = searchParams.get('token_hash') ?? searchParams.get('token')
  const type = (searchParams.get('type') as EmailOtpType | null) ?? null
  const nextParam = searchParams.get('next')

  // Scrub the recovery token out of the visible URL on mount, so it can't leak
  // to analytics page-view tracking or the Referer header while the user reads
  // the confirmation page. useSearchParams keeps the captured values above;
  // window.history.replaceState does not disturb them or trigger a navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const current = new URLSearchParams(window.location.search)
    if (current.get('token_hash') || current.get('token')) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname
      )
    }
  }, [])
  const safeNext = useMemo(() => {
    if (isSafeInternalPath(nextParam)) return nextParam as string
    return (type && NEXT_BY_TYPE[type]) || '/cabinet'
  }, [nextParam, type])

  const copy =
    type === 'recovery' || type === 'invite'
      ? FALLBACK.recovery
      : FALLBACK.default
  const copyKey =
    type === 'recovery' || type === 'invite' ? 'recovery' : 'default'

  const handleConfirm = async () => {
    setError(null)

    if (!tokenHash || !type) {
      setError(
        tx('auth.confirm.errors.invalidLink', FALLBACK.errors.invalidLink)
      )
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError(
        tx('auth.confirm.errors.unavailable', FALLBACK.errors.unavailable)
      )
      return
    }

    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })

      if (verifyError) {
        setError(tx('auth.confirm.errors.generic', FALLBACK.errors.generic))
        setLoading(false)
        return
      }

      router.replace(safeNext)
      router.refresh()
    } catch {
      // Network/thrown rejection (not resolved-with-error): re-enable the
      // button and show a message rather than leaving it stuck disabled.
      setError(tx('auth.confirm.errors.generic', FALLBACK.errors.generic))
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const linkComplete = Boolean(tokenHash && type)

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
          <h1 className="mt-3 text-lg font-bold text-dental-dark">
            {tx(`auth.confirm.${copyKey}.title`, copy.title)}
          </h1>
          <p className="text-dental-muted text-sm mt-1">
            {tx(`auth.confirm.${copyKey}.description`, copy.description)}
          </p>
        </div>

        <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-6 p-3 bg-dental-error-light border border-dental-error/20 rounded-xl text-dental-error-dark text-sm"
            >
              {error}
            </div>
          )}

          {!linkComplete && !error ? (
            <div
              role="alert"
              className="p-3 bg-dental-error-light border border-dental-error/20 rounded-xl text-dental-error-dark text-sm"
            >
              {tx(
                'auth.confirm.errors.invalidLink',
                FALLBACK.errors.invalidLink
              )}
            </div>
          ) : (
            linkComplete && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                aria-busy={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-dental-secondary-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400"
              >
                {loading ? (
                  <>
                    <span
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      {tx('auth.confirm.verifying', FALLBACK.verifying)}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} aria-hidden="true" />
                    {tx(`auth.confirm.${copyKey}.submit`, copy.submit)}
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            )
          )}

          <p className="text-center mt-6 text-sm text-dental-muted">
            {error || !linkComplete ? (
              <Link
                href="/auth/forgot-password"
                className="font-semibold text-dental-primary-ink hover:text-dental-primary-700 transition-colors"
              >
                {tx('auth.confirm.requestNewLink', FALLBACK.requestNewLink)}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="font-semibold text-dental-primary-ink hover:text-dental-primary-700 transition-colors"
              >
                {tx('auth.confirm.backToLogin', FALLBACK.backToLogin)}
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  )
}
