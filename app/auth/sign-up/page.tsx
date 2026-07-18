'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'
import { Input } from '@/components/ui'

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
      'bg-dental-error',
      'bg-dental-warning',
      'bg-dental-primary-500',
      'bg-dental-success',
    ]
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const { strength, label, color } = passwordStrength()

  return (
    /* Макет 1j: split-екран, як на сторінці входу */
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
            {t('auth.split.welcomeNew')}
          </p>
          <p className="mt-2 max-w-sm text-[15px] font-light leading-relaxed text-dental-primary-100">
            {t('auth.split.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-dental-secondary-50 px-4 py-10">
        <div className="w-full max-w-md">
          {/* Logo (мобільний/планшет — без фотопанелі) */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block">
              <Logo variant="default" size="md" />
            </Link>
          </div>
          <h1 className="mb-6 text-center font-heading text-3xl font-extrabold tracking-tight text-dental-dark lg:text-left">
            {t('auth.signUp.subtitle')}
          </h1>

          {/* Sign Up Form */}
          <div className="bg-white rounded-2xl shadow-soft p-5 sm:p-8">
            <form onSubmit={handleSignUp} className="space-y-5">
              {error && (
                <div className="bg-status-error-100 border border-dental-error/20 text-status-error-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Пара «Ім'я/Прізвище» симетрична (Ф2) — спільний ui/Input */}
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  label={t('auth.signUp.firstName')}
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.firstNamePlaceholder')}
                  required
                  fullWidth
                  className="min-h-[50px]"
                />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  label={t('auth.signUp.lastName')}
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.lastNamePlaceholder')}
                  required
                  fullWidth
                  className="min-h-[50px]"
                />
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

              <Input
                id="email"
                name="email"
                type="email"
                label={t('auth.signUp.emailLabel')}
                icon={<Mail size={18} />}
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.signUp.emailPlaceholder')}
                required
                fullWidth
                className="min-h-[50px]"
              />

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-dental-dark mb-2"
                >
                  {t('auth.signUp.passwordLabel')}
                </label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
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
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.passwordPlaceholder')}
                  required
                  fullWidth
                  className="min-h-[50px]"
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i <= strength ? color : 'bg-dental-secondary-200'}`}
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
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock size={18} />}
                  trailing={
                    formData.confirmPassword &&
                    formData.password === formData.confirmPassword ? (
                      <Check
                        aria-hidden="true"
                        className="mr-1.5 h-5 w-5 text-dental-success"
                      />
                    ) : undefined
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                  required
                  fullWidth
                  className="min-h-[50px]"
                />
              </div>

              {/* Повнорядковий label згоди — тач-ціль ≥44px (04, Ф4) */}
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dental-secondary-200 px-4 py-2.5 transition-colors hover:bg-dental-primary-50 has-checked:border-dental-primary-400 has-checked:bg-dental-primary-50">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={e => setAgreeToTerms(e.target.checked)}
                  required
                  className="h-5 w-5 shrink-0 accent-dental-primary-600"
                />
                <span className="text-sm text-dental-text">
                  {t('auth.signUp.agreePrefix')}{' '}
                  <Link
                    href="/terms-of-service"
                    className="text-dental-primary-ink hover:text-dental-primary-700 underline"
                  >
                    {t('auth.signUp.termsLink')}
                  </Link>{' '}
                  {t('auth.signUp.agreeAnd')}{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-dental-primary-ink hover:text-dental-primary-700 underline"
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
                  className="text-dental-primary-ink hover:text-dental-primary-700 font-semibold underline"
                >
                  {t('auth.signUp.loginLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
