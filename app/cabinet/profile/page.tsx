'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, User } from 'lucide-react'

interface PatientProfile {
  first_name: string | null
  last_name: string | null
  patronymic: string | null
  phone: string | null
  date_of_birth: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PatientProfile>({
    first_name: '',
    last_name: '',
    patronymic: '',
    phone: '',
    date_of_birth: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          patronymic: data.patronymic || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
        })
      }
      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
    setMessage(null)
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('380')) {
      const rest = digits.slice(3)
      if (rest.length <= 2) return `+380 ${rest}`
      if (rest.length <= 5) return `+380 ${rest.slice(0, 2)} ${rest.slice(2)}`
      if (rest.length <= 7) return `+380 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
      return `+380 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setProfile({ ...profile, phone: formatted })
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { error } = await supabase
      .from('patients')
      .upsert({
        id: user.id,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        patronymic: profile.patronymic || null,
        phone: profile.phone || null,
        date_of_birth: profile.date_of_birth || null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setMessage({ type: 'error', text: 'Помилка збереження. Спробуйте пізніше.' })
    } else {
      setMessage({ type: 'success', text: 'Профіль успішно оновлено!' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/cabinet" className="text-slate-500 hover:text-slate-700">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Редагування профілю</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-teal-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-slate-500">Пацієнт Dental Story</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Прізвище
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={profile.last_name || ''}
                  onChange={handleChange}
                  placeholder="Коваленко"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Ім'я
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={profile.first_name || ''}
                  onChange={handleChange}
                  placeholder="Олександр"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="patronymic" className="block text-sm font-medium text-slate-700 mb-2">
                По батькові
              </label>
              <input
                id="patronymic"
                name="patronymic"
                type="text"
                value={profile.patronymic || ''}
                onChange={handleChange}
                placeholder="Петрович"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                Телефон
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={handlePhoneChange}
                placeholder="+380 67 123 45 67"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700 mb-2">
                Дата народження
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={profile.date_of_birth || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Зберегти зміни
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
