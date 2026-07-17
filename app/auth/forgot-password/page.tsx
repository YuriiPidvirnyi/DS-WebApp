'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Mail } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { requestPasswordReset } from '@/services/auth'

const FALLBACK = {
  subtitle: 'Вкажіть email, і ми надішлемо посилання для відновлення доступу.',
  emailLabel: 'Email',
  emailPlaceholder: 'your@email.com',
  submit: 'Надіслати посилання',
  successTitle: 'Лист надіслано',
  successDescription:
    'Якщо акаунт існує, ви отримаєте лист із подальшими інструкціями.',
  backToLogin: 'Повернутись до входу',
  errors: {
    unavailable: 'Відновлення пароля тимчасово недоступне',
    generic: 'Не вдалося надіслати лист. Спробуйте пізніше.',
  },
}

export default function ForgotPasswordPage() {
  const { t, i18n, ready } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [expired, setExpired] = useState(false)
  const tx = useMemo(
    () => (key: string, fallback: string) => {
      const value = t(key)
      return value && value !== key ? value : fallback
    },
    [t]
  )

  // Set when an expired/consumed recovery link bounced back here (see
  // RootAuthRedirect). Read from the URL directly to avoid a Suspense boundary.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('expired') === '1') {
      setExpired(true)
      // Clear the flag from the URL so a refresh doesn't re-show the notice.
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname
      )
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Logo variant="default" size="md" />
            </Link>
          </div>
          <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    // Normalize a possibly-regional tag (e.g. `en-US`, `pl-PL`) down to its base
    // language before matching supported locales — otherwise a user browsing in
    // en-US would silently fall through to the Ukrainian email.
    const base = (i18n.language || 'uk').split('-')[0].toLowerCase()
    const locale = (['uk', 'en', 'pl'].includes(base) ? base : 'uk') as
      | 'uk'
      | 'en'
      | 'pl'

    try {
      const res = await requestPasswordReset(email.trim(), locale)
      if (!res.success) {
        setError(
          tx('auth.forgotPassword.errors.generic', FALLBACK.errors.generic)
        )
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError(
        tx('auth.forgotPassword.errors.generic', FALLBACK.errors.generic)
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
          <p className="text-dental-muted text-sm mt-2">
            {tx('auth.forgotPassword.subtitle', FALLBACK.subtitle)}
          </p>
        </div>

        <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
          {sent ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <p className="font-semibold">
                  {tx(
                    'auth.forgotPassword.successTitle',
                    FALLBACK.successTitle
                  )}
                </p>
                <p className="mt-1">
                  {tx(
                    'auth.forgotPassword.successDescription',
                    FALLBACK.successDescription
                  )}
                </p>
              </div>

              <Link
                href="/auth/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 text-white font-semibold text-sm rounded-xl transition-all duration-200"
              >
                {tx('auth.forgotPassword.backToLogin', FALLBACK.backToLogin)}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {expired && !error && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  {tx(
                    'auth.forgotPassword.expiredNotice',
                    'Термін дії посилання минув. Введіть email, щоб отримати нове.'
                  )}
                </div>
              )}
              {error && (
                <div className="mb-6 p-3 bg-dental-error-light border border-red-200 rounded-xl text-dental-error-dark text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-dental-dark mb-1.5"
                >
                  {tx('auth.forgotPassword.emailLabel', FALLBACK.emailLabel)}
                </label>
                <div className="flex items-center gap-3 border border-dental-secondary-200 rounded-xl px-4 py-3 transition-colors focus-within:border-dental-primary-600 focus-within:ring-2 focus-within:ring-dental-primary-100">
                  <Mail size={18} className="text-dental-muted shrink-0" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={tx(
                      'auth.forgotPassword.emailPlaceholder',
                      FALLBACK.emailPlaceholder
                    )}
                    required
                    autoComplete="email"
                    className="w-full text-sm text-dental-dark placeholder:text-dental-text-light outline-hidden bg-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-gray-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {tx('auth.forgotPassword.submit', FALLBACK.submit)}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {!sent && (
            <p className="text-center mt-6 text-sm text-dental-muted">
              <Link
                href="/auth/login"
                className="font-semibold text-dental-primary-600 hover:text-dental-primary-700 transition-colors"
              >
                {tx('auth.forgotPassword.backToLogin', FALLBACK.backToLogin)}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
