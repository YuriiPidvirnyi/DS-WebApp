'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import Logo from '@/components/ui/Logo'
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
  const passwordResetSuccess = searchParams.get('passwordReset') === 'success'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.login.errors.unavailable'))
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(
        error.message.includes('Invalid login credentials')
          ? t('auth.login.errors.invalidCredentials')
          : error.message.includes('Email not confirmed')
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
    router.push('/cabinet')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
          <h1 className="text-dental-muted text-sm mt-2">
            {t('auth.login.subtitle')}
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-soft rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin}>
            {passwordResetSuccess && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {t('auth.login.passwordResetSuccess')}
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 bg-dental-error-light border border-red-200 rounded-xl text-dental-error-dark text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dental-dark mb-1.5"
              >
                {t('auth.login.emailLabel')}
              </label>
              <div className="flex items-center gap-3 border border-dental-secondary-200 rounded-xl px-4 py-3 transition-colors focus-within:border-dental-primary-600 focus-within:ring-2 focus-within:ring-dental-primary-100">
                <Mail size={18} className="text-dental-muted shrink-0" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  required
                  autoComplete="email"
                  className="w-full text-sm text-dental-dark placeholder:text-dental-text-light outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dental-dark mb-1.5"
              >
                {t('auth.login.passwordLabel')}
              </label>
              <div className="flex items-center gap-3 border border-dental-secondary-200 rounded-xl px-4 py-3 transition-colors focus-within:border-dental-primary-600 focus-within:ring-2 focus-within:ring-dental-primary-100">
                <Lock size={18} className="text-dental-muted shrink-0" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                  className="w-full text-sm text-dental-dark placeholder:text-dental-text-light outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-dental-muted hover:text-dental-dark transition-colors shrink-0"
                  aria-label={
                    showPassword
                      ? t('auth.login.hidePassword')
                      : t('auth.login.showPassword')
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-end mb-6">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-dental-primary-600 hover:text-dental-primary-700 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-gray-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-400"
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
              className="font-semibold text-dental-primary-600 hover:text-dental-primary-700 transition-colors"
            >
              {t('auth.login.signUpLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
