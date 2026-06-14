'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import {
  Save,
  User,
  Mail,
  Check,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'
import { ErrorState } from '@/components/ui/ErrorState'
import { useCSRF } from '@/hooks/useCSRF'
import {
  trackEvent,
  CabinetEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'
import * as Sentry from '@sentry/nextjs'
import { captureException } from '@/utils/sentry'

interface PatientProfile {
  first_name: string | null
  last_name: string | null
  patronymic: string | null
  phone: string | null
  date_of_birth: string | null
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse" role="status" aria-busy="true">
      <div className="h-7 w-48 bg-dental-secondary-200 rounded-lg mb-6" />
      <div className="bg-white rounded-2xl p-8 shadow-xs border border-dental-secondary-100">
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
  const router = useRouter()
  const { getHeaders } = useCSRF()

  // Data-rights state
  const [downloading, setDownloading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dataRightsError, setDataRightsError] = useState<string | null>(null)

  const handleExport = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/cabinet/export')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDataRightsError(null)
    try {
      const res = await fetch('/api/cabinet/delete-account', {
        method: 'DELETE',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const supabase = createClient()
      if (supabase) await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setDataRightsError(t('cabinet.error.description'))
      setDeleting(false)
    }
  }

  const [profile, setProfile] = useState<PatientProfile>({
    first_name: '',
    last_name: '',
    patronymic: '',
    phone: '',
    date_of_birth: '',
  })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState(false)

  const initialProfileRef = useRef<PatientProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        if (!supabase) return

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Profile fetch error:', error)
          setFetchError(true)
          setLoading(false)
          return
        }

        setEmail(user.email || '')

        const profileData: PatientProfile = {
          first_name: data?.first_name || '',
          last_name: data?.last_name || '',
          patronymic: data?.patronymic || '',
          phone: data?.phone || '',
          date_of_birth: data?.date_of_birth || '',
        }

        setProfile(profileData)
        initialProfileRef.current = { ...profileData }
        setLoading(false)
      } catch (err) {
        console.error('Profile fetch error:', err)
        setFetchError(true)
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Track dirty state
  const checkDirty = useCallback((newProfile: PatientProfile) => {
    if (!initialProfileRef.current) return
    const dirty = Object.keys(newProfile).some(
      key =>
        newProfile[key as keyof PatientProfile] !==
        initialProfileRef.current![key as keyof PatientProfile]
    )
    setIsDirty(dirty)
  }, [])

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProfile = { ...profile, [e.target.name]: e.target.value }
    setProfile(newProfile)
    checkDirty(newProfile)
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

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // optional
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('380')) {
      return digits.length === 12
    }
    return digits.length >= 10
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    const newProfile = { ...profile, phone: formatted }
    setProfile(newProfile)
    checkDirty(newProfile)
    setMessage(null)
    if (phoneError) setPhoneError(null)
  }

  const handlePhoneBlur = () => {
    if (profile.phone && !validatePhone(profile.phone)) {
      setPhoneError(t('cabinet.profile.errors.invalidPhone'))
    } else {
      setPhoneError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone before submit
    if (profile.phone && !validatePhone(profile.phone)) {
      setPhoneError(t('cabinet.profile.errors.invalidPhone'))
      return
    }

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
      initialProfileRef.current = { ...profile }
      setIsDirty(false)
      trackEvent(CabinetEvent.ProfileUpdated, AnalyticsEventCategory.Cabinet, {
        has_phone: !!profile.phone,
        has_dob: !!profile.date_of_birth,
      })
      Sentry.addBreadcrumb({
        category: 'cabinet',
        message: 'profile_updated',
        level: 'info',
      })
    }
    setSaving(false)
  }

  // Profile completeness
  const profileFields = [
    { key: 'last_name', filled: !!profile.last_name },
    { key: 'first_name', filled: !!profile.first_name },
    { key: 'phone', filled: !!profile.phone },
    { key: 'date_of_birth', filled: !!profile.date_of_birth },
  ]
  const filledCount = profileFields.filter(f => f.filled).length
  const profilePercent = Math.round((filledCount / profileFields.length) * 100)
  const profileComplete = profilePercent === 100

  const inputClasses =
    'w-full px-4 py-3 border border-dental-secondary-200 rounded-xl text-dental-dark focus:ring-2 focus:ring-dental-primary-500 focus:border-transparent transition-all placeholder:text-dental-muted/50'

  if (loading) return <ProfileSkeleton />

  if (fetchError) {
    return (
      <ErrorState
        title={t('cabinet.error.title')}
        description={t('cabinet.error.description')}
        onRetry={() => window.location.reload()}
        retryLabel={t('cabinet.error.retry')}
      />
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-dental-dark">
        {t('cabinet.profile.title')}
      </h1>

      <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100 p-6 sm:p-8">
        {/* Avatar + completeness */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dental-secondary-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dental-primary-50 rounded-full flex items-center justify-center shrink-0">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-dental-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-dental-dark">
              {[profile.first_name, profile.last_name]
                .filter(Boolean)
                .join(' ') || t('cabinet.defaultPatient')}
            </h2>
            {email && (
              <p className="text-sm text-dental-muted truncate">{email}</p>
            )}
            {/* Completeness bar */}
            {!profileComplete && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-dental-secondary-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      profilePercent === 100
                        ? 'bg-green-500'
                        : profilePercent >= 50
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }`}
                    style={{ width: `${profilePercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-dental-muted">
                  {profilePercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {/* Name section */}
          <fieldset>
            <legend className="text-xs font-medium text-dental-muted uppercase tracking-wider mb-3">
              {t('cabinet.profile.personalInfo')}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="mt-4">
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
          </fieldset>

          {/* Contact section */}
          <fieldset>
            <legend className="text-xs font-medium text-dental-muted uppercase tracking-wider mb-3">
              {t('cabinet.profile.contactInfo')}
            </legend>

            {email && (
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-dental-dark mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-dental-secondary-200 rounded-xl text-dental-muted bg-dental-secondary-50 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

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
                onBlur={handlePhoneBlur}
                placeholder={t('cabinet.profile.phonePlaceholder')}
                className={`${inputClasses} ${
                  phoneError
                    ? 'border-red-300! ring-red-200! focus:ring-red-300!'
                    : ''
                }`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {phoneError}
                </p>
              )}
            </div>
          </fieldset>

          {/* Additional section */}
          <fieldset>
            <legend className="text-xs font-medium text-dental-muted uppercase tracking-wider mb-3">
              {t('cabinet.profile.additionalInfo')}
            </legend>
            <div>
              <label
                htmlFor="date_of_birth"
                className="block text-sm font-medium text-dental-dark mb-1.5"
              >
                {t('cabinet.profile.dateOfBirth')}
              </label>
              {/* Custom date picker component for date of birth field */}
              <DatePicker
                value={profile.date_of_birth || ''}
                onChange={date => {
                  const newProfile = { ...profile, date_of_birth: date }
                  setProfile(newProfile)
                  checkDirty(newProfile)
                  setMessage(null)
                }}
                className={inputClasses}
                placeholder={
                  t('cabinet.profile.dateOfBirthPlaceholder') || 'MM/DD/YYYY'
                }
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !!phoneError}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                isDirty
                  ? 'bg-dental-primary-600 hover:bg-dental-primary-700 text-white disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2'
                  : 'bg-dental-secondary-100 text-dental-muted cursor-default'
              }`}
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
            {isDirty && (
              <p className="text-xs text-dental-muted text-center mt-2">
                {t('cabinet.profile.unsavedChanges')}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── Data rights ─────────────────────────────────────────────── */}

      {/* Download my data */}
      <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-dental-primary-50 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-dental-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-dental-dark">
              {t('cabinet.settings.exportSection.title')}
            </h2>
            <p className="mt-1 text-sm text-dental-muted">
              {t('cabinet.settings.exportSection.description')}
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={downloading}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:ring-offset-2"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('cabinet.profile.downloading')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('cabinet.profile.dataExport')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-2xl shadow-xs border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-dental-dark">
              {t('cabinet.settings.deleteSection.title')}
            </h2>
            <p className="mt-1 text-sm text-dental-muted">
              {t('cabinet.settings.deleteSection.description')}
            </p>

            {dataRightsError && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {dataRightsError}
              </div>
            )}

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('cabinet.profile.deleteAccount')}
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t('cabinet.profile.deleteConfirmMessage')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('cabinet.profile.deleting')}
                      </>
                    ) : (
                      t('cabinet.settings.deleteSection.confirmButton')
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDataRightsError(null)
                    }}
                    disabled={deleting}
                    className="px-4 py-2.5 text-dental-muted hover:text-dental-dark text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-secondary-300 focus:ring-offset-2"
                  >
                    {t('cabinet.settings.deleteSection.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
