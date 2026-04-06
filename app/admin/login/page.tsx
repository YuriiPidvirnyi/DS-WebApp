'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Logo from '@/components/ui/Logo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAdminAuth()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/admin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error || t('admin.login.errors.generic'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-primary/40 via-dental-secondary/30 to-dental-primary/20 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <Logo size="md" />
          </div>
          <p className="text-dental-text text-sm">{t('admin.login.title')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-dental-secondary/60 p-8">
          <h2 className="text-xl font-semibold text-dental-dark mb-6 text-center font-nunito">
            {t('admin.login.systemLogin')}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dental-text mb-2"
              >
                {t('admin.login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dental-text/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-dental-secondary rounded-xl focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors text-dental-dark placeholder:text-dental-text/40"
                  placeholder={t('admin.login.emailPlaceholder')}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dental-text mb-2"
              >
                {t('admin.login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dental-text/50" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-dental-secondary rounded-xl focus:ring-2 focus:ring-dental-teal focus:border-dental-teal transition-colors text-dental-dark placeholder:text-dental-text/40"
                  placeholder={t('admin.login.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dental-text/50 hover:text-dental-text transition-colors"
                  aria-label={
                    showPassword
                      ? t('admin.login.hidePassword')
                      : t('admin.login.showPassword')
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-dental-teal hover:bg-dental-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dental-teal"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t('admin.login.loading')}
                </span>
              ) : (
                t('admin.login.login')
              )}
            </button>
          </form>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-dental-text hover:text-dental-dark text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.login.backToSite')}
          </Link>
        </div>
      </div>
    </div>
  )
}
