'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from './utils'

interface AppointmentAnalyticsRow {
  appointment_date: string
  status: string
  price_uah: number | null
  source: string | null
  service_id: string | null
}

interface ServiceRow {
  id: string
  name_uk: string
}

interface AnalyticsModel {
  totalAppointments: number
  completedAppointments: number
  pendingAppointments: number
  cancelledAppointments: number
  completionRate: number
  revenue: number
  averageTicket: number
  totalPatients: number
  unreadContacts: number
  pendingReviews: number
  timeline: Array<{ date: string; count: number; revenue: number }>
  sourceBreakdown: Array<{ name: string; count: number }>
  topServices: Array<{ name: string; count: number }>
}

const PERIODS = [
  { label: '7 днів', value: 7 },
  { label: '30 днів', value: 30 },
  { label: '90 днів', value: 90 },
]

function buildTimeline(
  periodDays: number,
  appointments: AppointmentAnalyticsRow[]
) {
  const map = new Map<string, { count: number; revenue: number }>()
  const start = new Date()
  start.setDate(start.getDate() - (periodDays - 1))

  for (let i = 0; i < periodDays; i += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    const key = current.toISOString().slice(0, 10)
    map.set(key, { count: 0, revenue: 0 })
  }

  appointments.forEach(appointment => {
    const bucket = map.get(appointment.appointment_date)
    if (!bucket) return
    bucket.count += 1
    bucket.revenue += Number(appointment.price_uah || 0)
  })

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    revenue: data.revenue,
  }))
}

function buildTopServices(
  appointments: AppointmentAnalyticsRow[],
  services: ServiceRow[]
): Array<{ name: string; count: number }> {
  const serviceMap = new Map(
    services.map(service => [service.id, service.name_uk])
  )
  const counters = new Map<string, number>()

  appointments.forEach(appointment => {
    const key = appointment.service_id
      ? serviceMap.get(appointment.service_id) || 'Невідома послуга'
      : 'Без послуги'
    counters.set(key, (counters.get(key) || 0) + 1)
  })

  return Array.from(counters.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

export default function AdminAnalyticsPage() {
  const { preferences } = useAdminPreferences()
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30)
  const [model, setModel] = useState<AnalyticsModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPeriodDays(preferences.defaultAnalyticsPeriod)
  }, [preferences.defaultAnalyticsPeriod])

  const loadAnalytics = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError('Supabase не налаштований. Перевірте змінні середовища.')
        setIsLoading(false)
        return
      }

      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - (periodDays - 1))
        const fromDateIso = fromDate.toISOString().slice(0, 10)

        const [
          { data: appointmentsData, error: appointmentsError },
          { data: servicesData, error: servicesError },
          { count: totalPatients, error: patientsError },
          { count: unreadContacts, error: contactsError },
          { count: pendingReviews, error: reviewsError },
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('appointment_date, status, price_uah, source, service_id')
            .gte('appointment_date', fromDateIso),
          supabase.from('services').select('id, name_uk'),
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase
            .from('contact_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false),
          supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ])

        if (
          appointmentsError ||
          servicesError ||
          patientsError ||
          contactsError ||
          reviewsError
        ) {
          throw (
            appointmentsError ||
            servicesError ||
            patientsError ||
            contactsError ||
            reviewsError
          )
        }

        const appointments = (appointmentsData ||
          []) as AppointmentAnalyticsRow[]
        const services = (servicesData || []) as ServiceRow[]
        const totalAppointments = appointments.length
        const completedAppointments = appointments.filter(
          appointment => appointment.status === 'completed'
        ).length
        const pendingAppointments = appointments.filter(
          appointment => appointment.status === 'pending'
        ).length
        const cancelledAppointments = appointments.filter(appointment =>
          ['cancelled', 'no_show'].includes(appointment.status)
        ).length
        const revenue = appointments.reduce(
          (sum, appointment) => sum + Number(appointment.price_uah || 0),
          0
        )
        const completionRate =
          totalAppointments > 0
            ? (completedAppointments / totalAppointments) * 100
            : 0
        const averageTicket =
          completedAppointments > 0 ? revenue / completedAppointments : 0

        const sourceMap = new Map<string, number>()
        appointments.forEach(appointment => {
          const source = appointment.source || 'unknown'
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
        })

        const sourceBreakdown = Array.from(sourceMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const timeline = buildTimeline(periodDays, appointments)
        const topServices = buildTopServices(appointments, services)

        setModel({
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          cancelledAppointments,
          completionRate,
          revenue,
          averageTicket,
          totalPatients: totalPatients || 0,
          unreadContacts: unreadContacts || 0,
          pendingReviews: pendingReviews || 0,
          timeline,
          sourceBreakdown,
          topServices,
        })
      } catch (loadError) {
        console.error('Failed to load analytics:', loadError)
        setError('Не вдалося завантажити аналітику.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [periodDays]
  )

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const maxDailyAppointments = useMemo(() => {
    if (!model || model.timeline.length === 0) return 1
    return Math.max(...model.timeline.map(item => item.count), 1)
  }, [model])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            Аналітика клініки
          </h1>
          <p className="text-sm text-dental-text-light">
            Операційна аналітика в реальному часі по appointments, контактах і
            ревʼю.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodDays}
            onChange={event =>
              setPeriodDays(Number(event.target.value) as 7 | 30 | 90)
            }
            className="rounded-lg border border-dental-secondary px-3 py-2 text-sm"
          >
            {PERIODS.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAnalytics(true)}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Оновити
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || !model ? (
        <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light">
          Завантаження аналітики...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <p className="text-xs text-dental-text-light">Appointments</p>
              <p className="text-2xl font-bold text-dental-dark">
                {model.totalAppointments}
              </p>
            </div>
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <p className="text-xs text-dental-text-light">Completion rate</p>
              <p className="text-2xl font-bold text-green-600">
                {model.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <p className="text-xs text-dental-text-light">Revenue</p>
              <p className="text-xl font-bold text-dental-dark">
                {formatCurrency(model.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <p className="text-xs text-dental-text-light">Avg ticket</p>
              <p className="text-xl font-bold text-dental-dark">
                {formatCurrency(model.averageTicket)}
              </p>
            </div>
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <p className="text-xs text-dental-text-light">Patients</p>
              <p className="text-2xl font-bold text-dental-dark">
                {model.totalPatients}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-semibold text-dental-dark">
                Динаміка записів по днях
              </h2>
              <div className="mt-4 space-y-2">
                {model.timeline.map(item => (
                  <div key={item.date}>
                    <div className="mb-1 flex items-center justify-between text-xs text-dental-text-light">
                      <span>{item.date}</span>
                      <span>{item.count} записів</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dental-primary-100">
                      <div
                        className="h-full rounded-full bg-dental-primary-600"
                        style={{
                          width: `${(item.count / maxDailyAppointments) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-dental-dark">
                  Статуси
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-dental-text">
                  <li>pending: {model.pendingAppointments}</li>
                  <li>completed: {model.completedAppointments}</li>
                  <li>cancelled/no_show: {model.cancelledAppointments}</li>
                  <li>unread contacts: {model.unreadContacts}</li>
                  <li>pending reviews: {model.pendingReviews}</li>
                </ul>
              </div>
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-dental-dark">
                  Джерела записів
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-dental-text">
                  {model.sourceBreakdown.length === 0 ? (
                    <li>Немає даних</li>
                  ) : (
                    model.sourceBreakdown.map(source => (
                      <li
                        key={source.name}
                        className="flex justify-between gap-2"
                      >
                        <span>{source.name}</span>
                        <span className="font-semibold">{source.count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-dental-dark">
              Топ послуг
            </h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {model.topServices.length === 0 ? (
                <p className="text-sm text-dental-text-light">Немає даних</p>
              ) : (
                model.topServices.map(service => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between rounded-lg bg-dental-primary-50 px-3 py-2 text-sm"
                  >
                    <span className="text-dental-text">{service.name}</span>
                    <span className="font-semibold text-dental-dark">
                      {service.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
