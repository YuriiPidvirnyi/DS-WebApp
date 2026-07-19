'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

const SESSION_CHECK_ATTEMPTS = 5
const SESSION_CHECK_DELAY_MS = 350
const FALLBACK = {
  subtitle: 'Встановіть новий пароль для вашого акаунту.',
  checkingSession: 'Перевіряємо посилання відновлення...',
  passwordLabel: 'Новий пароль',
  passwordPlaceholder: 'Мінімум 8 символів',
  confirmPasswordLabel: 'Підтвердіть новий пароль',
  confirmPasswordPlaceholder: 'Повторіть новий пароль',
  showPassword: 'Показати пароль',
  hidePassword: 'Сховати пароль',
  submit: 'Оновити пароль',
  backToLogin: 'Повернутись до входу',
  errors: {
    unavailable: 'Відновлення пароля тимчасово недоступне',
    noSession:
      'Посилання недійсне або протерміноване. Запросіть нове посилання.',
    passwordsMismatch: 'Паролі не співпадають',
    passwordTooShort: 'Пароль має містити мінімум 8 символів',
    generic: 'Не вдалося оновити пароль. Спробуйте ще раз.',
  },
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t, ready } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const tx = useMemo(
    () => (key: string, fallback: string) => {
      const value = t(key)
      return value && value !== key ? value : fallback
    },
    [t]
  )

  useEffect(() => {
    if (!ready) {
      return
    }

    let cancelled = false

    const checkSession = async () => {
      const supabase = createClient()
      if (!supabase) {
        if (!cancelled) {
          setError(
            tx(
              'auth.resetPassword.errors.unavailable',
              FALLBACK.errors.unavailable
            )
          )
          setCheckingSession(false)
        }
        return
      }

      for (let attempt = 0; attempt < SESSION_CHECK_ATTEMPTS; attempt += 1) {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          if (!cancelled) {
            setCheckingSession(false)
          }
          return
        }

        await new Promise(resolve =>
          setTimeout(resolve, SESSION_CHECK_DELAY_MS)
        )
      }

      if (!cancelled) {
        setError(
          tx('auth.resetPassword.errors.noSession', FALLBACK.errors.noSession)
        )
        setCheckingSession(false)
      }
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [ready, tx])

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

    if (password !== confirmPassword) {
      setError(
        tx(
          'auth.resetPassword.errors.passwordsMismatch',
          FALLBACK.errors.passwordsMismatch
        )
      )
      return
    }

    if (password.length < 8) {
      setError(
        tx(
          'auth.resetPassword.errors.passwordTooShort',
          FALLBACK.errors.passwordTooShort
        )
      )
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError(
        tx('auth.resetPassword.errors.unavailable', FALLBACK.errors.unavailable)
      )
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(tx('auth.resetPassword.errors.generic', FALLBACK.errors.generic))
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/auth/login?passwordReset=success')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
          <p className="text-dental-muted text-sm mt-2">
            {tx('auth.resetPassword.subtitle', FALLBACK.subtitle)}
          </p>
        </div>

        <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
          {checkingSession ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-dental-muted">
                {tx(
                  'auth.resetPassword.checkingSession',
                  FALLBACK.checkingSession
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 p-3 bg-dental-error-light border border-dental-error/20 rounded-xl text-dental-error-dark text-sm">
                  {error}
                </div>
              )}

              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-dental-dark mb-1.5"
                >
                  {tx(
                    'auth.resetPassword.passwordLabel',
                    FALLBACK.passwordLabel
                  )}
                </label>
                <div className="flex items-center gap-3 border border-dental-secondary-200 rounded-xl px-4 py-3 transition-colors focus-within:border-dental-primary-600 focus-within:ring-2 focus-within:ring-dental-primary-100">
                  <Lock size={18} className="text-dental-muted shrink-0" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={tx(
                      'auth.resetPassword.passwordPlaceholder',
                      FALLBACK.passwordPlaceholder
                    )}
                    required
                    autoComplete="new-password"
                    className="w-full text-sm text-dental-dark placeholder:text-dental-muted outline-hidden bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="p-1 text-dental-muted hover:text-dental-dark transition-colors shrink-0"
                    aria-label={
                      showPassword
                        ? tx(
                            'auth.resetPassword.hidePassword',
                            FALLBACK.hidePassword
                          )
                        : tx(
                            'auth.resetPassword.showPassword',
                            FALLBACK.showPassword
                          )
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-dental-dark mb-1.5"
                >
                  {tx(
                    'auth.resetPassword.confirmPasswordLabel',
                    FALLBACK.confirmPasswordLabel
                  )}
                </label>
                <div className="flex items-center gap-3 border border-dental-secondary-200 rounded-xl px-4 py-3 transition-colors focus-within:border-dental-primary-600 focus-within:ring-2 focus-within:ring-dental-primary-100">
                  <Lock size={18} className="text-dental-muted shrink-0" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={tx(
                      'auth.resetPassword.confirmPasswordPlaceholder',
                      FALLBACK.confirmPasswordPlaceholder
                    )}
                    required
                    autoComplete="new-password"
                    className="w-full text-sm text-dental-dark placeholder:text-dental-muted outline-hidden bg-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-dental-secondary-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {tx('auth.resetPassword.submit', FALLBACK.submit)}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-dental-muted">
            <Link
              href="/auth/login"
              className="font-semibold text-dental-primary-ink hover:text-dental-primary-700 transition-colors"
            >
              {tx('auth.resetPassword.backToLogin', FALLBACK.backToLogin)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
