'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Check,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Ukrainian phone formatting
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    if (digits.length <= 8)
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.signUp.errors.passwordsMismatch'))
      return
    }

    if (formData.password.length < 8) {
      setError(t('auth.signUp.errors.passwordTooShort'))
      return
    }

    if (!agreeToTerms) {
      setError(t('auth.signUp.errors.termsRequired'))
      return
    }

    setLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.signUp.errors.unavailable'))
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/cabinet`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: '+380' + formData.phone.replace(/\s/g, ''),
        },
      },
    })

    if (error) {
      setError(
        error.message.includes('already registered')
          ? t('auth.signUp.errors.alreadyRegistered')
          : t('auth.signUp.errors.generic')
      )
      setLoading(false)
      return
    }

    const wasAlreadyRegistered =
      Array.isArray(data.user?.identities) && data.user.identities.length === 0

    if (wasAlreadyRegistered) {
      setError(t('auth.signUp.errors.alreadyRegistered'))
      setLoading(false)
      return
    }

    if (!data.user) {
      setError(t('auth.signUp.errors.generic'))
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/cabinet')
      router.refresh()
      return
    }

    router.push('/auth/sign-up-success')
  }

  const passwordStrength = () => {
    const { password } = formData
    if (!password) return { strength: 0, label: '' }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = [
      '',
      t('auth.signUp.passwordStrength.weak'),
      t('auth.signUp.passwordStrength.medium'),
      t('auth.signUp.passwordStrength.good'),
      t('auth.signUp.passwordStrength.strong'),
    ]
    const colors = [
      '',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-green-500',
    ]
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const { strength, label, color } = passwordStrength()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="default" size="md" />
          </Link>
          <h1 className="text-sm text-dental-muted mt-2">
            {t('auth.signUp.subtitle')}
          </h1>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-soft p-5 sm:p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-dental-dark mb-2"
                >
                  {t('auth.signUp.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dental-muted" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t('auth.signUp.firstNamePlaceholder')}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-dental-dark mb-2"
                >
                  {t('auth.signUp.lastName')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.lastNamePlaceholder')}
                  required
                  className="w-full px-4 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-dental-dark mb-2"
              >
                {t('auth.signUp.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dental-muted" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-dental-text">
                  +380
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder={t('auth.signUp.phonePlaceholder')}
                  required
                  maxLength={13}
                  className="w-full pl-20 pr-4 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-dental-dark mb-2"
              >
                {t('auth.signUp.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dental-muted" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.emailPlaceholder')}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-dental-dark mb-2"
              >
                {t('auth.signUp.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dental-muted" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.passwordPlaceholder')}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dental-muted hover:text-dental-text"
                  aria-label={
                    showPassword
                      ? t('auth.login.hidePassword')
                      : t('auth.login.showPassword')
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= strength ? color : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-dental-text">{label}</p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-dental-dark mb-2"
              >
                {t('auth.signUp.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dental-muted" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-2 focus:ring-dental-primary-100 focus:border-dental-primary-600 transition-all"
                />
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
              </div>
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={e => setAgreeToTerms(e.target.checked)}
                required
                className="mt-1 w-4 h-4 text-dental-primary-600 border-dental-secondary-300 rounded focus:ring-dental-primary-300"
              />
              <span className="text-sm text-dental-text">
                {t('auth.signUp.agreePrefix')}{' '}
                <Link
                  href="/terms-of-service"
                  className="text-dental-primary-600 hover:text-dental-primary-700 underline"
                >
                  {t('auth.signUp.termsLink')}
                </Link>{' '}
                {t('auth.signUp.agreeAnd')}{' '}
                <Link
                  href="/privacy-policy"
                  className="text-dental-primary-600 hover:text-dental-primary-700 underline"
                >
                  {t('auth.signUp.privacyLink')}
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dental-primary-600 hover:bg-dental-primary-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.signUp.submit')}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dental-text">
              {t('auth.signUp.hasAccount')}{' '}
              <Link
                href="/auth/login"
                className="text-dental-primary-600 hover:text-dental-primary-700 font-semibold underline"
              >
                {t('auth.signUp.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
