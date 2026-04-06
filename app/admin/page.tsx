'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { hasPermission } from '@/lib/permissions'
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
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

const SERVICE_COLORS = [
  '#0d9488',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#6b7280',
  '#ef4444',
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading: authLoading } = useAdminAuth()
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

        const appointmentsResults = await Promise.all([
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', today),
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'),
          supabase
            .from('appointments')
            .select(
              'id, patient_name, appointment_time, status, services(name_uk)'
            )
            .eq('appointment_date', today)
            .order('appointment_time', { ascending: true })
            .limit(5),
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

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    iconBg,
    href,
    badge,
  }: {
    title: string
    value: number | string
    trend?: number
    icon: React.ComponentType<{ className?: string }>
    iconBg: string
    href?: string
    badge?: string
  }) => {
    const content = (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-dental-secondary-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {badge && (
            <span className="bg-dental-error-light text-dental-error text-xs font-medium px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium text-dental-success">
              <ArrowUpRight className="w-4 h-4" />
              {trend}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-dental-dark">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-dental-text-light mt-1">{title}</p>
        </div>
      </div>
    )

    return href ? <Link href={href}>{content}</Link> : content
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dental-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-dental-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dental-dark">
                {t('common.brandName')} {t('admin.layout.panel')}
              </h1>
              <p className="text-sm text-dental-text-light">
                {t('admin.dashboard.clinicPanel')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-dental-text-light">
                <Clock className="w-4 h-4" />
                {t('admin.dashboard.updated')}: {lastUpdated}
              </div>
              <Link
                href="/admin/settings"
                className="p-2 text-dental-text-light hover:text-dental-primary-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title={t('admin.dashboard.totalAppointments')}
            value={stats?.totalAppointments || 0}
            icon={Calendar}
            iconBg="bg-dental-primary-500"
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
            iconBg="bg-dental-info"
            href="/admin/appointments?filter=today"
          />
          <StatCard
            title={t('admin.dashboard.contacts')}
            value={stats?.unreadContacts || 0}
            icon={MessageSquare}
            iconBg="bg-dental-warning"
            href="/admin/contacts"
            badge={
              stats?.unreadContacts
                ? t('admin.dashboard.newBadgePlural')
                : undefined
            }
          />
          <StatCard
            title={t('admin.dashboard.reviewsModeration')}
            value={stats?.pendingReviews || 0}
            icon={Star}
            iconBg="bg-dental-success"
            href="/admin/reviews"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-dental-secondary-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                {t('admin.dashboard.todayAppointments')}
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
                <p className="text-dental-text-light">
                  {t('admin.dashboard.noAppointmentsToday')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-dental-primary-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dental-primary-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-dental-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-dental-dark">
                          {apt.patient_name}
                        </p>
                        <p className="text-sm text-dental-text-light">
                          {apt.services?.[0]?.name_uk ||
                            t('admin.dashboard.consultation')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-dental-dark">
                        {apt.appointment_time.slice(0, 5)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmed'
                            ? 'bg-dental-success-light text-dental-success'
                            : apt.status === 'completed'
                              ? 'bg-dental-secondary-100 text-dental-text-light'
                              : 'bg-dental-warning-light text-dental-warning'
                        }`}
                      >
                        {apt.status === 'confirmed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {apt.status === 'confirmed'
                          ? t('admin.dashboard.statusConfirmed')
                          : apt.status === 'completed'
                            ? t('admin.dashboard.statusCompleted')
                            : t('admin.dashboard.statusPending')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-dental-secondary-200">
            <h2 className="text-lg font-semibold text-dental-dark mb-4">
              {t('admin.dashboard.serviceCategories')}
            </h2>
            {serviceStats.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-dental-secondary-300 mx-auto mb-3" />
                <p className="text-dental-text-light">
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
                        <span className="text-dental-text-light">
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
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/appointments"
            className="bg-dental-primary-600 rounded-xl p-4 text-white hover:bg-dental-primary-700 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {t('admin.sidebar.appointments')}
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalAppointments}</p>
          </Link>
          <Link
            href="/admin/doctors"
            className="bg-dental-info rounded-xl p-4 text-white hover:bg-dental-info-dark transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {t('admin.dashboard.doctors')}
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalDoctors}</p>
          </Link>
          <Link
            href="/admin/services"
            className="bg-dental-warning rounded-xl p-4 text-white hover:bg-dental-warning-dark transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {t('admin.sidebar.services')}
              </span>
            </div>
            <p className="text-lg font-bold">
              {t('admin.dashboard.priceList')}
            </p>
          </Link>
          <Link
            href="/admin/contacts"
            className="bg-dental-success rounded-xl p-4 text-white hover:bg-dental-success-dark transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {t('admin.dashboard.contacts')}
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.unreadContacts}</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
