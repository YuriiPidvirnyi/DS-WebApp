'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react'
import Logo from '@/components/ui/Logo'

export default function SignUpPage() {
  const router = useRouter()
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
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
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
      setError('Паролі не співпадають')
      return
    }

    if (formData.password.length < 8) {
      setError('Пароль має містити мінімум 8 символів')
      return
    }

    if (!agreeToTerms) {
      setError('Необхідно погодитися з умовами використання')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/cabinet`,
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
          ? 'Цей email вже зареєстрований'
          : 'Помилка реєстрації. Спробуйте пізніше.'
      )
      setLoading(false)
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
    
    const labels = ['', 'Слабкий', 'Середній', 'Добрий', 'Надійний']
    const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500', 'bg-green-500']
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const { strength, label, color } = passwordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="default" size="lg" />
          </Link>
          <p className="mt-4 text-muted-foreground">Створення облікового запису</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-card rounded-2xl shadow-soft border border-border p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  Ім'я
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Олександр"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Прізвище
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Коваленко"
                  required
                  className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground">+380</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="67 123 45 67"
                  required
                  maxLength={13}
                  className="w-full pl-20 pr-4 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Мінімум 8 символів"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= strength ? color : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Підтвердження пароля
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Повторіть пароль"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                )}
              </div>
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Я погоджуюся з{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  умовами використання
                </Link>{' '}
                та{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  політикою конфіденційності
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Зареєструватися
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Вже маєте акаунт?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-semibold">
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
