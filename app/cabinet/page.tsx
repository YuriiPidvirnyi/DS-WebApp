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
} from 'lucide-react'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  doctors:
    | { first_name: string; last_name: string; specialization: string }[]
    | null
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
    <div className="animate-pulse space-y-8">
      {/* Welcome skeleton */}
      <div>
        <div className="h-8 w-64 bg-dental-secondary-200 rounded-lg mb-2" />
        <div className="h-5 w-96 bg-dental-secondary-100 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <div className="h-24 bg-dental-primary-100 rounded-2xl" />
          <div className="h-20 bg-white rounded-2xl" />
          <div className="h-40 bg-white rounded-2xl" />
          <div className="h-48 bg-white rounded-2xl" />
        </div>
        {/* Right column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl">
            <div className="p-6 border-b border-dental-secondary-100">
              <div className="h-5 w-40 bg-dental-secondary-200 rounded" />
            </div>
            <div className="divide-y divide-dental-secondary-100">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex gap-4">
                  <div className="w-14 h-14 bg-dental-secondary-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-dental-secondary-200 rounded" />
                    <div className="h-3 w-32 bg-dental-secondary-100 rounded" />
                    <div className="h-3 w-20 bg-dental-secondary-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CabinetPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile and appointments in parallel
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
          .limit(5),
      ])

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
      setLoading(false)
    }

    fetchData()
  }, [t])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-dental-primary-100 text-dental-primary-600',
      completed: 'bg-dental-secondary-200 text-dental-dark',
      cancelled: 'bg-red-100 text-red-700',
    }
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
      >
        {t(`cabinet.status.${status}`, status)}
      </span>
    )
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dental-dark mb-1">
          {t('cabinet.welcome', { name: displayName })}
        </h1>
        <p className="text-dental-muted">{t('cabinet.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Quick Book CTA */}
          <Link
            href="/booking"
            className="block bg-dental-primary-600 text-white rounded-2xl p-5 hover:bg-dental-primary-700 transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-0.5">
                  {t('cabinet.bookAppointment')}
                </h3>
                <p className="text-white/70 text-sm">
                  {t('cabinet.chooseTime')}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Link>

          {/* Treatment History link */}
          <Link
            href="/cabinet/treatments"
            className="block bg-white rounded-2xl p-5 shadow-sm border border-dental-secondary-100 hover:border-dental-primary-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.treatmentHistory')}
              </h3>
              <div className="w-10 h-10 bg-dental-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-dental-primary-600" />
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-dental-secondary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.myProfile')}
              </h3>
              <Link
                href="/cabinet/profile"
                className="text-dental-primary-600 hover:text-dental-primary-700 text-sm font-medium"
              >
                {t('cabinet.edit')}
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-dental-muted text-sm">
                <User className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                <span>
                  {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-dental-muted text-sm">
                <Phone className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                <span>{profile?.phone || t('cabinet.notSpecified')}</span>
              </div>
              <div className="flex items-center gap-3 text-dental-muted text-sm">
                <Mail className="w-4 h-4 text-dental-secondary-300 shrink-0" />
                <span className="truncate">{displayName}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 overflow-hidden">
            <Link
              href="/cabinet/appointments"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-dental-primary-600" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.myAppointments')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-dental-muted" />
            </Link>
            <Link
              href="/booking"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors border-b border-dental-secondary-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-dental-primary-600" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.bookAppointment')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-dental-muted" />
            </Link>
            <Link
              href="/reviews"
              className="flex items-center justify-between p-4 hover:bg-dental-secondary-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-medium text-dental-dark text-sm">
                  {t('cabinet.myReviews')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-dental-muted" />
            </Link>
          </div>
        </div>

        {/* Right Column — Recent Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100">
            <div className="flex items-center justify-between p-5 border-b border-dental-secondary-100">
              <h3 className="font-semibold text-dental-dark">
                {t('cabinet.recentAppointments')}
              </h3>
              <Link
                href="/cabinet/appointments"
                className="text-dental-primary-600 hover:text-dental-primary-700 text-sm font-medium"
              >
                {t('cabinet.allAppointments')}
              </Link>
            </div>

            {appointments.length === 0 ? (
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
                  className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('cabinet.book')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-dental-secondary-100">
                {appointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 hover:bg-dental-secondary-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 sm:gap-4 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-dental-primary-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-base sm:text-lg font-bold text-dental-primary-600 leading-none">
                            {new Date(apt.appointment_date).getDate()}
                          </span>
                          <span className="text-[10px] sm:text-xs text-dental-primary-500">
                            {new Date(apt.appointment_date).toLocaleDateString(
                              'uk-UA',
                              { month: 'short' }
                            )}
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
                            {apt.services[0].price_uah.toLocaleString()}{' '}
                            {t('cabinet.currency')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
