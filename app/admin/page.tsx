'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  pendingAppointments: number
  completedAppointments: number
  totalPatients: number
  monthlyRevenue: number
  appointmentsTrend: number
  patientsTrend: number
}

interface ChartData {
  name: string
  appointments: number
  revenue: number
}

interface ServiceData {
  name: string
  value: number
  color: string
}

const mockStats: DashboardStats = {
  totalAppointments: 1248,
  todayAppointments: 12,
  pendingAppointments: 8,
  completedAppointments: 1156,
  totalPatients: 892,
  monthlyRevenue: 125600,
  appointmentsTrend: 12.5,
  patientsTrend: 8.3,
}

const mockChartData: ChartData[] = [
  { name: 'Mon', appointments: 24, revenue: 4800 },
  { name: 'Tue', appointments: 18, revenue: 3600 },
  { name: 'Wed', appointments: 32, revenue: 6400 },
  { name: 'Thu', appointments: 28, revenue: 5600 },
  { name: 'Fri', appointments: 35, revenue: 7000 },
  { name: 'Sat', appointments: 22, revenue: 4400 },
  { name: 'Sun', appointments: 0, revenue: 0 },
]

const mockServiceData: ServiceData[] = [
  { name: 'Cleaning', value: 35, color: '#0d9488' },
  { name: 'Fillings', value: 25, color: '#3b82f6' },
  { name: 'Whitening', value: 20, color: '#8b5cf6' },
  { name: 'Extraction', value: 12, color: '#f59e0b' },
  { name: 'Other', value: 8, color: '#6b7280' },
]

const recentAppointments = [
  { id: 1, patient: 'Ivan Petrenko', service: 'Professional Cleaning', time: '10:00', status: 'confirmed' },
  { id: 2, patient: 'Maria Kovalenko', service: 'Consultation', time: '11:30', status: 'pending' },
  { id: 3, patient: 'Oleksandr Shevchenko', service: 'Filling', time: '14:00', status: 'confirmed' },
  { id: 4, patient: 'Anna Bondar', service: 'Whitening', time: '15:30', status: 'pending' },
  { id: 5, patient: 'Dmytro Lysenko', service: 'Extraction', time: '17:00', status: 'confirmed' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [chartData, setChartData] = useState<ChartData[]>(mockChartData)
  const [serviceData, setServiceData] = useState<ServiceData[]>(mockServiceData)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Set time after mount to avoid hydration mismatch
      setLastUpdated(new Date().toLocaleTimeString())
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    iconBg,
    prefix = '',
    suffix = '',
  }: {
    title: string
    value: number | string
    trend?: number
    icon: React.ComponentType<{ className?: string }>
    iconBg: string
    prefix?: string
    suffix?: string
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix}
        </p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here is your clinic overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdated || '--:--:--'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          trend={stats.appointmentsTrend}
          icon={Calendar}
          iconBg="bg-blue-500"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Clock}
          iconBg="bg-green-500"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          trend={stats.patientsTrend}
          icon={Users}
          iconBg="bg-purple-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          icon={DollarSign}
          iconBg="bg-amber-500"
          suffix=" UAH"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Appointments</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAppointments)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
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
            {serviceData.map((service) => (
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
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h2>
            <span className="text-sm text-gray-500">{recentAppointments.length} appointments</span>
          </div>
          <div className="space-y-3">
            {recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dental-teal/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-dental-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patient}</p>
                    <p className="text-sm text-gray-500">{appointment.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{appointment.time}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {appointment.status === 'confirmed' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} UAH`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Completed</span>
          </div>
          <p className="text-2xl font-bold">{stats.completedAppointments}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Pending</span>
          </div>
          <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Growth</span>
          </div>
          <p className="text-2xl font-bold">+{stats.appointmentsTrend}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">New Patients</span>
          </div>
          <p className="text-2xl font-bold">+{Math.round(stats.totalPatients * 0.1)}</p>
        </div>
      </div>
    </div>
  )
}
