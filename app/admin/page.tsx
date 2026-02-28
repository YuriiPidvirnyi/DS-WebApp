'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
  LogOut,
  Settings,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

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
  services: { name_uk: string } | null
}

interface ServiceStat {
  name: string
  value: number
  color: string
}

const SERVICE_COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280', '#ef4444']

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!adminData) {
        router.push('/cabinet')
        return
      }

      setIsAdmin(true)

      // Fetch all stats
      const today = new Date().toISOString().split('T')[0]
      
      const [
        { count: totalAppointments },
        { count: todayCount },
        { count: pendingAppointments },
        { count: completedAppointments },
        { count: totalDoctors },
        { count: unreadContacts },
        { count: pendingReviews },
        { data: todayAppts },
        { data: serviceData },
      ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('appointments')
          .select('id, patient_name, appointment_time, status, services(name_uk)')
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true })
          .limit(5),
        supabase.from('services')
          .select('category')
          .eq('is_active', true),
      ])

      setStats({
        totalAppointments: totalAppointments || 0,
        todayAppointments: todayCount || 0,
        pendingAppointments: pendingAppointments || 0,
        completedAppointments: completedAppointments || 0,
        totalDoctors: totalDoctors || 0,
        unreadContacts: unreadContacts || 0,
        pendingReviews: pendingReviews || 0,
      })

      setTodayAppointments(todayAppts || [])

      // Calculate service distribution
      if (serviceData) {
        const categories = serviceData.reduce((acc, s) => {
          acc[s.category] = (acc[s.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const total = Object.values(categories).reduce((a, b) => a + b, 0)
        const serviceStatsData = Object.entries(categories).map(([name, count], i) => ({
          name,
          value: Math.round((count / total) * 100),
          color: SERVICE_COLORS[i % SERVICE_COLORS.length],
        }))
        setServiceStats(serviceStatsData)
      }

      setLastUpdated(new Date().toLocaleTimeString('uk-UA'))
      setIsLoading(false)
    }

    checkAdminAndFetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {badge && (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              {trend}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('uk-UA') : value}
          </p>
          <p className="text-sm text-gray-500 mt-1">{title}</p>
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

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dental<span className="text-teal-600">Story</span> Admin
              </h1>
              <p className="text-sm text-slate-500">Панель керування клінікою</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Оновлено: {lastUpdated}
              </div>
              <Link
                href="/admin/settings"
                className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Всього записів"
            value={stats?.totalAppointments || 0}
            icon={Calendar}
            iconBg="bg-teal-500"
            href="/admin/appointments"
            badge={stats?.pendingAppointments ? `${stats.pendingAppointments} нових` : undefined}
          />
          <StatCard
            title="Сьогодні"
            value={stats?.todayAppointments || 0}
            icon={Clock}
            iconBg="bg-blue-500"
            href="/admin/appointments?filter=today"
          />
          <StatCard
            title="Звернень"
            value={stats?.unreadContacts || 0}
            icon={MessageSquare}
            iconBg="bg-purple-500"
            href="/admin/contacts"
            badge={stats?.unreadContacts ? 'нові' : undefined}
          />
          <StatCard
            title="Відгуків на модерації"
            value={stats?.pendingReviews || 0}
            icon={Star}
            iconBg="bg-yellow-500"
            href="/admin/reviews"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Записи на сьогодні</h2>
              <Link href="/admin/appointments?filter=today" className="text-sm text-teal-600 hover:text-teal-700">
                Всі записи
              </Link>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">На сьогодні записів немає</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.patient_name}</p>
                        <p className="text-sm text-gray-500">{apt.services?.name_uk || 'Консультація'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{apt.appointment_time.slice(0, 5)}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {apt.status === 'confirmed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {apt.status === 'confirmed' ? 'Підтверджено' : 
                         apt.status === 'completed' ? 'Завершено' : 'Очікує'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Категорії послуг</h2>
            {serviceStats.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Немає даних</p>
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
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {serviceStats.map((service) => (
                    <div key={service.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-gray-600">{service.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{service.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/appointments" className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white hover:from-teal-600 hover:to-teal-700 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Записи</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalAppointments}</p>
          </Link>
          <Link href="/admin/doctors" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Лікарі</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalDoctors}</p>
          </Link>
          <Link href="/admin/services" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white hover:from-purple-600 hover:to-purple-700 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Послуги</span>
            </div>
            <p className="text-lg font-bold">Прайс-лист</p>
          </Link>
          <Link href="/admin/contacts" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white hover:from-orange-600 hover:to-orange-700 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Звернення</span>
            </div>
            <p className="text-2xl font-bold">{stats?.unreadContacts}</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
