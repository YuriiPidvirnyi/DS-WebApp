'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Save, User } from 'lucide-react'

interface PatientProfile {
  first_name: string | null
  last_name: string | null
  patronymic: string | null
  phone: string | null
  date_of_birth: string | null
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="h-7 w-48 bg-dental-secondary-200 rounded-lg mb-6" />
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-dental-secondary-100">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-dental-secondary-100">
          <div className="w-20 h-20 bg-dental-secondary-100 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-dental-secondary-200 rounded" />
            <div className="h-4 w-32 bg-dental-secondary-100 rounded" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-12 bg-dental-secondary-100 rounded-xl" />
            <div className="h-12 bg-dental-secondary-100 rounded-xl" />
          </div>
          <div className="h-12 bg-dental-secondary-100 rounded-xl" />
          <div className="h-12 bg-dental-secondary-100 rounded-xl" />
          <div className="h-12 bg-dental-secondary-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<PatientProfile>({
    first_name: '',
    last_name: '',
    patronymic: '',
    phone: '',
    date_of_birth: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

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
  }, [])

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
      if (rest.length <= 7)
        return `+380 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
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
    if (!supabase) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('patients').upsert({
      id: user.id,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      patronymic: profile.patronymic || null,
      phone: profile.phone || null,
      date_of_birth: profile.date_of_birth || null,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      setMessage({
        type: 'error',
        text: t('cabinet.profile.errors.saveFailed'),
      })
    } else {
      setMessage({ type: 'success', text: t('cabinet.profile.saveSuccess') })
    }
    setSaving(false)
  }

  const inputClasses =
    'w-full px-4 py-3 border border-dental-secondary-200 rounded-xl text-dental-dark focus:ring-2 focus:ring-dental-primary-500 focus:border-transparent transition-all placeholder:text-dental-muted/50'

  if (loading) return <ProfileSkeleton />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-dental-dark mb-6">
        {t('cabinet.profile.title')}
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 p-6 sm:p-8">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-dental-secondary-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dental-primary-50 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-dental-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-dental-dark">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-dental-muted">
              {t('cabinet.profile.patientLabel')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div
              className={`px-4 py-3 rounded-xl text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-dental-dark mb-1.5"
              >
                {t('cabinet.profile.lastName')}
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={profile.last_name || ''}
                onChange={handleChange}
                placeholder={t('cabinet.profile.lastNamePlaceholder')}
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-dental-dark mb-1.5"
              >
                {t('cabinet.profile.firstName')}
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={profile.first_name || ''}
                onChange={handleChange}
                placeholder={t('cabinet.profile.firstNamePlaceholder')}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="patronymic"
              className="block text-sm font-medium text-dental-dark mb-1.5"
            >
              {t('cabinet.profile.patronymic')}
            </label>
            <input
              id="patronymic"
              name="patronymic"
              type="text"
              value={profile.patronymic || ''}
              onChange={handleChange}
              placeholder={t('cabinet.profile.patronymicPlaceholder')}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-dental-dark mb-1.5"
            >
              {t('cabinet.profile.phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={handlePhoneChange}
              placeholder={t('cabinet.profile.phonePlaceholder')}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium text-dental-dark mb-1.5"
            >
              {t('cabinet.profile.dateOfBirth')}
            </label>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={profile.date_of_birth || ''}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-dental-primary-600 hover:bg-dental-primary-700 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('cabinet.profile.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
