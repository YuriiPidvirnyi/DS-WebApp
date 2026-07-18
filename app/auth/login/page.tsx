'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { getAdminAccess } from '@/lib/supabase/admin'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { Input } from '@/components/ui'
import {
  trackEvent,
  CabinetEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendState, setResendState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')
  const passwordResetSuccess = searchParams.get('passwordReset') === 'success'

  const handleResendConfirmation = async () => {
    const supabase = createClient()
    if (!supabase || !email) return
    setResendState('sending')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    setResendState(resendError ? 'error' : 'sent')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailNotConfirmed(false)
    setResendState('idle')
    setLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.login.errors.unavailable'))
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Prefer Supabase's stable error.code; fall back to message text for
      // older clients that don't populate it.
      const code = (error as { code?: string }).code
      const notConfirmed =
        code === 'email_not_confirmed' ||
        error.message.includes('Email not confirmed')
      const invalidCredentials =
        code === 'invalid_credentials' ||
        error.message.includes('Invalid login credentials')
      setEmailNotConfirmed(notConfirmed)
      setError(
        invalidCredentials
          ? t('auth.login.errors.invalidCredentials')
          : notConfirmed
            ? t('auth.login.errors.emailNotConfirmed')
            : t('auth.login.errors.generic')
      )
      setLoading(false)
      return
    }

    try {
      trackEvent(CabinetEvent.CabinetLogin, AnalyticsEventCategory.Cabinet)
    } catch {
      // analytics may fail silently
    }

    const adminAccess = await getAdminAccess(supabase, data.user.id)
    router.push(adminAccess ? '/admin' : '/cabinet')
    router.refresh()
  }

  return (
    /* Макет 1j: split-екран — фото клініки повертає бренд і довіру до входу */
    <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 lg:grid-cols-[44%_1fr]">
      <div className="relative hidden lg:block">
        <Image
          src="/assets/images/brand/happy-patient.jpg"
          alt=""
          fill
          sizes="44vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-dental-dark/15 to-dental-dark/70"
        />
        <div className="absolute bottom-0 left-0 p-10">
          <span className="inline-block rounded-lg bg-white px-3 py-2">
            <Logo variant="default" size="sm" />
          </span>
          <p className="mt-4 font-heading text-2xl font-extrabold text-white">
            {t('auth.split.welcomeBack')}
          </p>
          <p className="mt-2 max-w-sm text-[15px] font-light leading-relaxed text-dental-primary-100">
            {t('auth.split.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-dental-secondary-50 px-4 py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Logo (мобільний/планшет — без фотопанелі) */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block">
              <Logo variant="default" size="md" />
            </Link>
          </div>
          <h1 className="mb-6 text-center font-heading text-3xl font-extrabold tracking-tight text-dental-dark lg:text-left">
            {t('auth.login.subtitle')}
          </h1>

          {/* Form Card */}
          <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleLogin}>
              {passwordResetSuccess && (
                <div className="mb-6 p-3 bg-status-success-100 border border-dental-success/30 rounded-xl text-status-success-700 text-sm">
                  {t('auth.login.passwordResetSuccess')}
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-dental-error-light border border-dental-error/20 rounded-xl text-dental-error-dark text-sm">
                  {error}
                  {emailNotConfirmed && (
                    <div className="mt-2">
                      {resendState === 'sent' ? (
                        <span className="text-status-success-700">
                          {t('auth.login.resendConfirmation.sent')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendState === 'sending'}
                          className="font-semibold text-dental-primary-ink hover:text-dental-primary-700 underline disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-dental-primary-400 rounded"
                        >
                          {resendState === 'sending'
                            ? t('auth.login.resendConfirmation.sending')
                            : t('auth.login.resendConfirmation.action')}
                        </button>
                      )}
                      {resendState === 'error' && (
                        <span className="block mt-1">
                          {t('auth.login.resendConfirmation.error')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Email — спільний ui/Input (Ф1) */}
              <div className="mb-5">
                <Input
                  id="email"
                  type="email"
                  label={t('auth.login.emailLabel')}
                  icon={<Mail size={18} />}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  required
                  autoComplete="email"
                  fullWidth
                  className="min-h-[50px]"
                />
              </div>

              {/* Password — спільний ui/Input, показ пароля має власну ціль ≥36px */}
              <div className="mb-5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.login.passwordLabel')}
                  icon={<Lock size={18} />}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-dental-muted hover:text-dental-dark transition-colors"
                      aria-label={
                        showPassword
                          ? t('auth.login.hidePassword')
                          : t('auth.login.showPassword')
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                  fullWidth
                  className="min-h-[50px]"
                />
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end mb-6">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-dental-primary-ink hover:text-dental-primary-700 transition-colors"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-13 flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-dental-secondary-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('auth.login.submit')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Sign up */}
            <p className="text-center mt-6 text-sm text-dental-muted">
              {t('auth.login.noAccount')}{' '}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-dental-primary-ink hover:text-dental-primary-700 transition-colors"
              >
                {t('auth.login.signUpLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
