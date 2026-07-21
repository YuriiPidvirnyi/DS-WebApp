'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar,
  Clock,
  User,
  FileText,
  Plus,
  ChevronRight,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  CalendarCheck,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { Card, StatusBadge, type StatusTone } from '@/components/ui'
import { StatCard } from '@/components/cards'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  doctors:
    { first_name: string; last_name: string; specialization: string }[] | null
  services: { name_uk: string; price_uah: number }[] | null
}

interface PatientProfile {
  first_name: string | null
  last_name: string | null
  phone: string | null
  date_of_birth: string | null
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8" role="status" aria-busy="true">
      <div>
        <div className="h-8 w-64 bg-dental-secondary-200 rounded-lg mb-2" />
        <div className="h-5 w-96 bg-dental-secondary-100 rounded-lg" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-24 bg-white rounded-2xl border border-dental-secondary-100"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="h-24 bg-dental-primary-100 rounded-2xl" />
          <div className="h-40 bg-white rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl h-80" />
        </div>
      </div>
    </div>
  )
}

function getTimeGreetingKey(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'cabinet.greeting.morning'
  if (hour >= 12 && hour < 18) return 'cabinet.greeting.afternoon'
  return 'cabinet.greeting.evening'
}

export default function CabinetPage() {
  const { t, i18n } = useTranslation()
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        if (!supabase) return

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const [profileResult, appointmentsResult] = await Promise.all([
          supabase
            .from('patients')
            .select('first_name, last_name, phone, date_of_birth')
            .eq('id', user.id)
            .single(),
          supabase
            .from('appointments')
            .select(
              `id, appointment_date, appointment_time, status,
              doctors (first_name, last_name, specialization),
              services (name_uk, price_uah)`
            )
            .eq('patient_id', user.id)
            .order('appointment_date', { ascending: false })
            .limit(10),
        ])

        if (appointmentsResult.error) {
          console.error('Appointments fetch error:', appointmentsResult.error)
        }

        const profileData = profileResult.data
        setProfile(profileData)
        setAppointments(
          (appointmentsResult.data as unknown as Appointment[]) || []
        )

        setDisplayName(
          profileData?.first_name ||
            user.user_metadata?.first_name ||
            t('cabinet.defaultPatient')
        )
        setEmail(user.email || '')
        setLoading(false)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setFetchError(true)
        setLoading(false)
      }
    }

    fetchData()
  }, [t])

  const getStatusBadge = (status: string) => {
    const tones: Record<string, StatusTone> = {
      pending: 'warning',
      confirmed: 'accent',
      completed: 'success',
      cancelled: 'neutral',
    }
    return (
      <StatusBadge tone={tones[status] || 'warning'}>
        {t(`cabinet.status.${status}`, status)}
      </StatusBadge>
    )
  }

  // Locale helper
  const locale = i18n.language || 'uk'
  const dateLocale =
    locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US'

  const getDayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    return d
      .toLocaleDateString(dateLocale, { weekday: 'short' })
      .replace('.', '')
  }

  if (loading) return <DashboardSkeleton />

  if (fetchError) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center shadow-xs border border-dental-error/20">
        <div className="w-16 h-16 bg-status-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-dental-error" />
        </div>
        <h2 className="text-lg font-semibold text-dental-dark mb-2">
          {t('cabinet.error.title')}
        </h2>
        <p className="text-dental-muted text-sm mb-6 max-w-md mx-auto">
          {t('cabinet.error.description')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-700"
        >
          {t('cabinet.error.retry')}
        </button>
      </div>
    )
  }

  // Compute stats
  const now = new Date()
  const upcomingAppointments = appointments.filter(
    apt =>
      new Date(apt.appointment_date) >= now &&
      apt.status !== 'cancelled' &&
      apt.status !== 'completed'
  )
  const completedCount = appointments.filter(
    apt => apt.status === 'completed'
  ).length
  const nextAppointment = upcomingAppointments.sort(
    (a, b) =>
      new Date(a.appointment_date).getTime() -
      new Date(b.appointment_date).getTime()
  )[0]

  const recentAppointments = appointments.slice(0, 5)

  // Profile completeness
  const profileFields = [
    { key: 'first_name', filled: !!profile?.first_name },
    { key: 'last_name', filled: !!profile?.last_name },
    { key: 'phone', filled: !!profile?.phone },
    { key: 'date_of_birth', filled: !!profile?.date_of_birth },
  ]
  const filledCount = profileFields.filter(f => f.filled).length
  const profilePercent = Math.round((filledCount / profileFields.length) * 100)
  const profileComplete = profilePercent === 100

  // Profile display name
  const profileDisplayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dental-dark mb-1">
          {t(getTimeGreetingKey(), { name: displayName })}
        </h1>
        <p className="text-dental-muted">{t('cabinet.subtitle')}</p>
      </div>

      {/* Next Appointment Highlight OR Empty CTA */}
      {nextAppointment ? (
        /* Плаский брендовий тінт замість єдиного в системі градієнта (1f, знахідка 20) */
        <div className="bg-dental-primary-100 border border-dental-primary-200 rounded-md p-5 sm:p-6 text-dental-dark">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-16 bg-dental-primary-600 text-white rounded-md flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] text-white/80 font-medium uppercase leading-none">
                  {getDayOfWeek(nextAppointment.appointment_date)}
                </span>
                <span className="font-heading text-lg font-extrabold leading-tight">
                  {new Date(nextAppointment.appointment_date).getDate()}
                </span>
                <span className="text-[10px] text-white/80 uppercase leading-none">
                  {new Date(
                    nextAppointment.appointment_date
                  ).toLocaleDateString(dateLocale, { month: 'short' })}
                </span>
              </div>
              <div>
                <p className="text-dental-muted text-xs font-medium uppercase tracking-wider mb-1">
                  {t('cabinet.dashboard.nextAppointment')}
                </p>
                <h3 className="font-semibold text-lg text-dental-dark">
                  {nextAppointment.services?.[0]?.name_uk ||
                    t('cabinet.consultation')}
                </h3>
                <p className="text-dental-text text-sm mt-0.5">
                  {nextAppointment.doctors?.[0]?.last_name}{' '}
                  {nextAppointment.doctors?.[0]?.first_name}
                  {nextAppointment.doctors?.[0]?.specialization &&
                    ` — ${nextAppointment.doctors[0].specialization}`}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 text-dental-muted text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {nextAppointment.appointment_time.slice(0, 5)}
                </div>
              </div>
            </div>
            <Link
              href="/cabinet/appointments"
              className="inline-flex items-center gap-2 min-h-11 bg-white border border-dental-primary-200 text-dental-primary-ink hover:bg-dental-primary-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 focus:outline-hidden focus:ring-2 focus:ring-dental-primary-400"
            >
              {t('cabinet.dashboard.viewDetails')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-linear-to-r from-dental-secondary-100 to-dental-secondary-50 rounded-2xl p-5 sm:p-6 border border-dental-secondary-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-dental-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-7 h-7 text-dental-primary-ink" />
              </div>
              <div>
                <h3 className="font-semibold text-dental-dark text-lg">
                  {t('cabinet.dashboard.noUpcoming')}
                </h3>
                <p className="text-dental-muted text-sm mt-0.5">
                  {t('cabinet.dashboard.noUpcomingDesc')}
                </p>
              </div>
            </div>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 focus:outline-hidden focus:ring-2 focus:ring-dental-primary-700"
            >
              <Plus className="w-4 h-4" />
              {t('cabinet.bookAppointment')}
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats — clickable, navigate to filtered appointments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('cabinet.dashboard.upcoming')}
          value={upcomingAppointments.length}
          icon={<CalendarCheck className="w-5 h-5 text-dental-primary-ink" />}
          iconBg="bg-dental-primary-50"
          href="/cabinet/appointments?filter=upcoming"
        />
        <StatCard
          label={t('cabinet.dashboard.completed')}
          value={completedCount}
          icon={<CheckCircle2 className="w-5 h-5 text-dental-success" />}
          iconBg="bg-status-success-100"
          href="/cabinet/appointments?filter=past"
        />
        <StatCard
          label={t('cabinet.dashboard.total')}
          value={appointments.length}
          icon={<Activity className="w-5 h-5 text-dental-primary-ink" />}
          iconBg="bg-dental-primary-50"
          href="/cabinet/appointments"
        />
        <Link
          href="/booking"
          className="bg-dental-primary-600 hover:bg-dental-primary-700 rounded-2xl p-4 shadow-xs transition-colors group focus:outline-hidden focus:ring-2 focus:ring-dental-primary-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {t('cabinet.bookAppointment')}
              </p>
              <p className="text-xs text-white/70">{t('cabinet.chooseTime')}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Profile Completeness */}
          {!profileComplete && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-dental-warning/30">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-dental-warning shrink-0" />
                <h3 className="font-semibold text-dental-dark text-sm">
                  {t('cabinet.dashboard.profileIncomplete')}
                </h3>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-dental-secondary-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dental-warning rounded-full transition-all"
                    style={{ width: `${profilePercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-dental-muted">
                  {profilePercent}%
                </span>
              </div>
              <p className="text-xs text-dental-muted mb-3">
                {t('cabinet.dashboard.profileHint')}
              </p>
              <Link
                href="/cabinet/profile"
                className="text-xs font-medium text-dental-primary-ink hover:text-dental-primary-700 transition-colors rounded focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
              >
                {t('cabinet.dashboard.completeProfile')}
                <ChevronRight className="w-3 h-3 inline ml-0.5" />
              </Link>
            </div>
          )}

          {/* Treatment History link */}
          <Link
            href="/cabinet/treatments"
            className="block bg-white rounded-2xl p-5 shadow-xs border border-dental-secondary-100 hover:border-dental-primary-200 hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.treatmentHistory')}
              </h3>
              <div className="w-10 h-10 bg-dental-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-dental-primary-ink" />
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-dental-secondary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.myProfile')}
              </h3>
              <Link
                href="/cabinet/profile"
                className="text-dental-primary-ink hover:text-dental-primary-700 text-sm font-medium rounded focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
              >
                {t('cabinet.edit')}
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                <span
                  className={
                    profileDisplayName
                      ? 'text-dental-muted'
                      : 'text-dental-secondary-300 italic'
                  }
                >
                  {profileDisplayName || t('cabinet.notSpecified')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                <span
                  className={
                    profile?.phone
                      ? 'text-dental-muted'
                      : 'text-dental-secondary-300 italic'
                  }
                >
                  {profile?.phone || t('cabinet.notSpecified')}
                </span>
              </div>
              {profile?.date_of_birth && (
                <div className="flex items-center gap-3 text-dental-muted text-sm">
                  <Calendar className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                  <span>
                    {new Date(profile.date_of_birth).toLocaleDateString(
                      dateLocale,
                      { day: 'numeric', month: 'long', year: 'numeric' }
                    )}
                  </span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 text-dental-muted text-sm">
                  <Mail className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100 overflow-hidden">
            <Link
              href="/cabinet/appointments"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-dental-primary-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-dental-primary-ink" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.myAppointments')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-dental-muted" />
            </Link>
            <Link
              href="/cabinet/payments"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-dental-primary-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-dental-primary-ink" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.sidebar.payments')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dental-secondary-200 text-dental-muted font-medium">
                  {t('cabinet.sidebar.soon')}
                </span>
                <ChevronRight className="w-4 h-4 text-dental-muted" />
              </div>
            </Link>
            <a
              href="/r/google?src=cabinet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-dental-primary-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-status-warning-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-dental-warning" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.googleReview')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-dental-muted" />
            </a>
          </div>
        </div>

        {/* Right Column — Recent Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xs border border-dental-secondary-100">
            <div className="flex items-center justify-between p-5 border-b border-dental-secondary-100">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.recentAppointments')}
              </h3>
              <Link
                href="/cabinet/appointments"
                className="text-dental-primary-ink hover:text-dental-primary-700 text-sm font-medium rounded focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
              >
                {t('cabinet.allAppointments')}
              </Link>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-dental-secondary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-dental-muted" />
                </div>
                <h4 className="font-medium text-dental-dark mb-1">
                  {t('cabinet.noAppointments')}
                </h4>
                <p className="text-dental-muted text-sm mb-4">
                  {t('cabinet.bookWithSpecialists')}
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  {t('cabinet.book')}
                </Link>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {recentAppointments.map(apt => (
                  <Card
                    key={apt.id}
                    variant="ghost"
                    padding="sm"
                    className="hover:bg-dental-secondary-50/50 transition-colors"
                  >
                    <Link
                      href="/cabinet/appointments"
                      className="block min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-dental-primary-500 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 sm:gap-4 min-w-0">
                          {/* Date block with day-of-week */}
                          <div className="w-12 h-14 sm:w-14 sm:h-16 bg-dental-primary-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] sm:text-[10px] text-dental-primary-500 font-medium uppercase leading-none">
                              {getDayOfWeek(apt.appointment_date)}
                            </span>
                            <span className="text-base sm:text-lg font-bold text-dental-primary-ink leading-tight">
                              {new Date(apt.appointment_date).getDate()}
                            </span>
                            <span className="text-[10px] sm:text-xs text-dental-primary-500 leading-none">
                              {new Date(
                                apt.appointment_date
                              ).toLocaleDateString(dateLocale, {
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-dental-dark text-sm truncate">
                              {apt.services?.[0]?.name_uk ||
                                t('cabinet.consultation')}
                            </h4>
                            <p className="text-xs text-dental-muted truncate">
                              {apt.doctors?.[0]?.last_name}{' '}
                              {apt.doctors?.[0]?.first_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-dental-muted">
                              <Clock className="w-3.5 h-3.5" />
                              {apt.appointment_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {getStatusBadge(apt.status)}
                          {apt.services?.[0]?.price_uah && (
                            <p className="text-xs text-dental-muted mt-2">
                              {apt.services[0].price_uah.toLocaleString(
                                dateLocale
                              )}{' '}
                              {t('cabinet.currency')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
