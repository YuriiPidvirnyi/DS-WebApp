'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import { hasPermission } from '@/lib/permissions'
import OnboardingTour from '@/components/admin/OnboardingTour'
import OnboardingChecklist from '@/components/admin/OnboardingChecklist'
import { StatusBadge } from '@/components/ui'
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  MessageSquare,
  Star,
  Settings,
} from 'lucide-react'

// Dynamic import for heavy chart components - ssr: false to avoid hydration issues
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), {
  ssr: false,
})
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-dental-primary-50 rounded animate-pulse" />
    ),
  }
)
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), {
  ssr: false,
})
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), {
  ssr: false,
})
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), {
  ssr: false,
})

interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  pendingAppointments: number
  completedAppointments: number
  totalDoctors: number
  unreadContacts: number
  pendingReviews: number
}

interface Appointment {
  id: string
  patient_name: string
  appointment_time: string
  status: string
  services: { name_uk: string }[] | null
}

interface ServiceStat {
  name: string
  value: number
  color: string
}

/* Серії графіка — тональна шкала бренду (знахідка 03): 600/500/300/900 + secondary */
const SERVICE_COLORS = [
  '#3f6f79',
  '#7ba8b0',
  '#aeced3',
  '#2a3c40',
  '#d1cac0',
  '#c5dde1',
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const pageAccessLoading = useAdminPageAccess('dashboard:view')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      const supabase = createClient()
      if (!supabase) return

      // Doctor without a linked doctor_id cannot see appointments
      if (user.role === 'doctor' && !user.doctorId) {
        setError(t('admin.dashboard.doctorNotLinked'))
        setIsLoading(false)
        return
      }

      try {
        const today = new Date().toISOString().split('T')[0]
        const canSeeContacts = hasPermission(user.role, 'appointments:view_all')
        const canSeeReviews = hasPermission(user.role, 'settings:view')

        // Doctors see only their own schedule (RLS enforces this too, but
        // explicit scoping keeps the intent visible and the counts honest).
        const doctorId = user.role === 'doctor' ? user.doctorId : null
        const scopeToDoctor = <T extends { eq: (c: string, v: string) => T }>(
          q: T
        ): T => (doctorId ? q.eq('doctor_id', doctorId) : q)

        const appointmentsResults = await Promise.all([
          scopeToDoctor(
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
          ),
          scopeToDoctor(
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('appointment_date', today)
          ),
          scopeToDoctor(
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')
          ),
          scopeToDoctor(
            supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'completed')
          ),
          scopeToDoctor(
            supabase
              .from('appointments')
              .select(
                'id, patient_name, appointment_time, status, services(name_uk)'
              )
              .eq('appointment_date', today)
          )
            .order('appointment_time', { ascending: true })
            .limit(doctorId ? 10 : 5),
        ])

        const [
          { count: totalAppointments },
          { count: todayCount },
          { count: pendingAppointments },
          { count: completedAppointments },
          { data: todayAppts },
        ] = appointmentsResults

        let totalDoctors = 0
        let unreadContacts = 0
        let pendingReviews = 0
        let serviceData = null

        if (canSeeContacts) {
          const [doctorsRes, contactsRes, servicesRes] = await Promise.all([
            supabase
              .from('doctors')
              .select('*', { count: 'exact', head: true })
              .eq('is_active', true),
            supabase
              .from('contact_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('is_read', false),
            supabase.from('services').select('category').eq('is_active', true),
          ])
          totalDoctors = doctorsRes.count || 0
          unreadContacts = contactsRes.count || 0
          serviceData = servicesRes.data
        }

        if (canSeeReviews) {
          const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
          pendingReviews = count || 0
        }

        setStats({
          totalAppointments: totalAppointments || 0,
          todayAppointments: todayCount || 0,
          pendingAppointments: pendingAppointments || 0,
          completedAppointments: completedAppointments || 0,
          totalDoctors,
          unreadContacts,
          pendingReviews,
        })

        setTodayAppointments(todayAppts || [])

        if (serviceData) {
          const categories = serviceData.reduce(
            (acc: Record<string, number>, s: { category: string }) => {
              acc[s.category] = (acc[s.category] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          )

          const vals = Object.values(categories) as number[]
          const total = vals.reduce((a, b) => a + b, 0)
          const serviceStatsData = (
            Object.entries(categories) as [string, number][]
          ).map(([name, count], i) => ({
            name,
            value: Math.round((count / total) * 100),
            color: SERVICE_COLORS[i % SERVICE_COLORS.length],
          }))
          setServiceStats(serviceStatsData)
        }

        setLastUpdated(new Date().toLocaleTimeString('uk-UA'))
      } catch (fetchError) {
        captureException(
          fetchError instanceof Error
            ? fetchError
            : new Error(String(fetchError))
        )
        setError(t('admin.dashboard.loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [authLoading, isAuthenticated, user, t])

  /*
   * Плитка-статистика (макет 1c): нейтральна картка + брендовий тінт іконки;
   * семантика лишається тільки статус-бейджам (знахідка 09), підписи — AA (01).
   */
  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    href,
    badge,
    badgeTone = 'accent',
  }: {
    title: string
    value: number | string
    trend?: number
    icon: React.ComponentType<{ className?: string }>
    href?: string
    badge?: string
    badgeTone?: 'accent' | 'warning'
  }) => {
    const content = (
      <div className="bg-white rounded-md shadow-xs p-5 border border-dental-secondary-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-accent-100">
            <Icon className="w-5 h-5 text-status-accent-700" />
          </div>
          {badge && <StatusBadge tone={badgeTone}>{badge}</StatusBadge>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium text-status-success-700">
              <ArrowUpRight className="w-4 h-4" />
              {trend}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-dental-dark">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-dental-muted mt-1">{title}</p>
        </div>
      </div>
    )

    return href ? <Link href={href}>{content}</Link> : content
  }

  if (isLoading || pageAccessLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-dental-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const isDoctor = user.role === 'doctor'
  const canSeeContacts = hasPermission(user.role, 'appointments:view_all')
  const canSeeReviews = hasPermission(user.role, 'settings:view')

  return (
    <div className="space-y-6">
      <OnboardingTour role={user?.role} />

      {/* Page meta bar: subtitle + last-updated + settings shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-dental-muted">
          {t('admin.dashboard.clinicPanel')}
        </p>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-dental-muted">
              <Clock className="w-4 h-4" />
              {t('admin.dashboard.updated')}: {lastUpdated}
            </div>
          )}
          <Link
            href="/admin/settings"
            aria-label={t('admin.sidebar.settings')}
            className="p-2 rounded-lg text-dental-muted hover:text-dental-primary-600 hover:bg-dental-secondary-50 transition-colors focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <OnboardingChecklist />
      {error && (
        <div className="rounded-xl border border-dental-error/20 bg-status-error-100 px-4 py-3 text-sm text-status-error-700">
          {error}
        </div>
      )}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title={t('admin.dashboard.totalAppointments')}
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          href="/admin/appointments"
          badge={
            stats?.pendingAppointments
              ? `${stats.pendingAppointments} ${t('admin.dashboard.newBadge')}`
              : undefined
          }
        />
        <StatCard
          title={t('admin.dashboard.today')}
          value={stats?.todayAppointments || 0}
          icon={Clock}
          href="/admin/appointments?filter=today"
        />
        {canSeeContacts && (
          <StatCard
            title={t('admin.dashboard.contacts')}
            value={stats?.unreadContacts || 0}
            icon={MessageSquare}
            href="/admin/contacts"
            badgeTone="warning"
            badge={
              stats?.unreadContacts
                ? t('admin.dashboard.newBadgePlural')
                : undefined
            }
          />
        )}
        {canSeeReviews && (
          <StatCard
            title={t('admin.dashboard.reviewsModeration')}
            value={stats?.pendingReviews || 0}
            icon={Star}
            href="/admin/reviews"
          />
        )}
        {isDoctor && (
          <StatCard
            title={t('admin.dashboard.completed')}
            value={stats?.completedAppointments || 0}
            icon={CheckCircle}
            href="/admin/treatments"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div
          className={`${canSeeContacts ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow-xs p-6 border border-dental-secondary-200`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dental-dark">
              {isDoctor
                ? t('admin.dashboard.myTodayAppointments')
                : t('admin.dashboard.todayAppointments')}
            </h2>
            <Link
              href="/admin/appointments?filter=today"
              className="text-sm text-dental-primary-600 hover:text-dental-primary-700"
            >
              {t('admin.dashboard.allAppointments')}
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-dental-secondary-300 mx-auto mb-3" />
              <p className="text-dental-muted">
                {t('admin.dashboard.noAppointmentsToday')}
              </p>
            </div>
          ) : (
            /* Щільний табличний ряд час-пацієнт-послуга-статус (макет 1c) */
            <div>
              {todayAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="grid grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_1fr_auto] items-center gap-3 border-b border-dental-secondary-100 py-3 last:border-b-0"
                >
                  <p className="font-heading font-bold text-dental-dark">
                    {apt.appointment_time.slice(0, 5)}
                  </p>
                  <p className="font-medium text-dental-dark truncate">
                    {apt.patient_name}
                  </p>
                  <p className="hidden sm:block text-sm text-dental-text truncate">
                    {apt.services?.[0]?.name_uk ||
                      t('admin.dashboard.consultation')}
                  </p>
                  <StatusBadge
                    tone={
                      apt.status === 'confirmed'
                        ? 'accent'
                        : apt.status === 'completed'
                          ? 'success'
                          : apt.status === 'cancelled'
                            ? 'neutral'
                            : 'warning'
                    }
                  >
                    {apt.status === 'confirmed'
                      ? t('admin.dashboard.statusConfirmed')
                      : apt.status === 'completed'
                        ? t('admin.dashboard.statusCompleted')
                        : apt.status === 'cancelled'
                          ? t('admin.appointmentStatuses.cancelled')
                          : t('admin.dashboard.statusPending')}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services Distribution (hidden for doctor-scoped dashboards) */}
        {canSeeContacts && (
          <div className="bg-white rounded-xl shadow-xs p-6 border border-dental-secondary-200">
            <h2 className="text-lg font-semibold text-dental-dark mb-4">
              {t('admin.dashboard.serviceCategories')}
            </h2>
            {serviceStats.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-dental-secondary-300 mx-auto mb-3" />
                <p className="text-dental-muted">
                  {t('admin.dashboard.noData')}
                </p>
              </div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {serviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${`var(--color-dental-secondary-200)`}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {serviceStats.map(service => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-dental-muted">
                          {service.name}
                        </span>
                      </div>
                      <span className="font-medium text-dental-dark">
                        {service.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/*
        Швидкі лінки — нейтральні/брендові плитки; семантичні кольори
        лишаються статус-бейджам (знахідка 09). Головна дія — одна, teal.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/appointments"
          className="bg-dental-primary-600 rounded-md p-4 text-white hover:bg-dental-primary-700 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">
              {t('admin.sidebar.appointments')}
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalAppointments}</p>
        </Link>
        {canSeeContacts && (
          <Link
            href="/admin/doctors"
            className="bg-white border border-dental-secondary-200 rounded-md p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2 text-status-accent-700">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium text-dental-muted">
                {t('admin.dashboard.doctors')}
              </span>
            </div>
            <p className="text-2xl font-bold text-dental-dark">
              {stats?.totalDoctors}
            </p>
          </Link>
        )}
        {isDoctor && (
          <Link
            href="/admin/treatments"
            className="bg-white border border-dental-secondary-200 rounded-md p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2 text-status-accent-700">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium text-dental-muted">
                {t('admin.sidebar.treatments')}
              </span>
            </div>
            <p className="text-lg font-bold text-dental-dark">
              {t('admin.dashboard.myTreatments')}
            </p>
          </Link>
        )}
        <Link
          href="/admin/services"
          className="bg-white border border-dental-secondary-200 rounded-md p-4 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2 mb-2 text-status-accent-700">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium text-dental-muted">
              {t('admin.sidebar.services')}
            </span>
          </div>
          <p className="text-lg font-bold text-dental-dark">
            {t('admin.dashboard.priceList')}
          </p>
        </Link>
        {canSeeContacts && (
          <Link
            href="/admin/contacts"
            className="bg-white border border-dental-secondary-200 rounded-md p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2 text-status-accent-700">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium text-dental-muted">
                {t('admin.dashboard.contacts')}
              </span>
            </div>
            <p className="text-2xl font-bold text-dental-dark">
              {stats?.unreadContacts}
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}
