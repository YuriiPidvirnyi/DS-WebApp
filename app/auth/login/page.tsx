'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Невірний email або пароль'
          : 'Помилка входу. Спробуйте пізніше.'
      )
      setLoading(false)
      return
    }

    router.push('/cabinet')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-foreground">
              Dental<span className="text-primary">Story</span>
            </h1>
          </Link>
          <p className="mt-2 text-muted-foreground">Вхід до особистого кабінету</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-soft border border-border p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введіть пароль"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary border-input rounded focus:ring-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Запам'ятати мене</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80">
                Забули пароль?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Увійти
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Ще не маєте акаунту?{' '}
              <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 font-semibold">
                Зареєструватися
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Переваги особистого кабінету:</p>
          <ul className="mt-2 space-y-1">
            <li>Історія візитів та лікування</li>
            <li>Онлайн-запис до лікаря</li>
            <li>Персональні рекомендації</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
