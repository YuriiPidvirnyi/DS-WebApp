'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, ChevronLeft, Filter, Plus, X } from 'lucide-react'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  doctors: { first_name: string; last_name: string; specialization: string }[]
  services: { name_uk: string; price_uah: number; duration_minutes: number }[]
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient()
      if (!supabase) {
        router.push('/auth/login')
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('appointments')
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          doctors (first_name, last_name, specialization),
          services (name_uk, price_uah, duration_minutes)
        `
        )
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false })

      setAppointments(data || [])
      setLoading(false)
    }

    fetchAppointments()
  }, [router])

  const handleCancel = async (id: string) => {
    if (!confirm(t('cabinet.appointments.cancelConfirm'))) return

    setCancellingId(id)
    const supabase = createClient()
    if (!supabase) return

    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: 'cancelled' } : apt))
    )
    setCancellingId(null)
  }

  const filteredAppointments = appointments.filter(apt => {
    const isUpcoming = new Date(apt.appointment_date) >= new Date()
    if (filter === 'upcoming') return isUpcoming && apt.status !== 'cancelled'
    if (filter === 'past') return !isUpcoming || apt.status === 'completed'
    return true
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-teal-100 text-teal-700 border-teal-200',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    }
    const labels: Record<string, string> = {
      pending: t('cabinet.appointments.status.pending'),
      confirmed: t('cabinet.appointments.status.confirmed'),
      completed: t('cabinet.appointments.status.completed'),
      cancelled: t('cabinet.appointments.status.cancelled'),
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    )
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cabinet"
                className="text-slate-500 hover:text-slate-700"
                aria-label={t('common.back')}
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900">
                {t('cabinet.appointments.title')}
              </h1>
            </div>
            <Link
              href="/booking"
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('cabinet.appointments.newAppointment')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2">
            {(['all', 'upcoming', 'past'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 'all' && t('cabinet.appointments.filters.all')}
                {f === 'upcoming' && t('cabinet.appointments.filters.upcoming')}
                {f === 'past' && t('cabinet.appointments.filters.past')}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {filter === 'upcoming'
                ? t('cabinet.appointments.empty.upcoming')
                : filter === 'past'
                  ? t('cabinet.appointments.empty.past')
                  : t('cabinet.appointments.empty.all')}
            </h3>
            <p className="text-slate-500 mb-6">
              {t('cabinet.appointments.empty.cta')}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('cabinet.appointments.book')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(apt => {
              const isUpcoming = new Date(apt.appointment_date) >= new Date()
              const canCancel =
                isUpcoming &&
                apt.status !== 'cancelled' &&
                apt.status !== 'completed'

              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl p-6 shadow-soft ${
                    apt.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-teal-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-teal-600">
                          {new Date(apt.appointment_date).getDate()}
                        </span>
                        <span className="text-xs text-teal-500">
                          {new Date(apt.appointment_date).toLocaleDateString(
                            'uk-UA',
                            { month: 'short' }
                          )}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {apt.services?.[0]?.name_uk ||
                            t('cabinet.appointments.consultation')}
                        </h3>
                        <p className="text-sm text-slate-500 mb-2">
                          {apt.doctors?.[0]?.last_name}{' '}
                          {apt.doctors?.[0]?.first_name} -{' '}
                          {apt.doctors?.[0]?.specialization}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.appointment_time.slice(0, 5)}
                          </div>
                          {apt.services?.[0]?.duration_minutes && (
                            <span>
                              {apt.services[0].duration_minutes}{' '}
                              {t('cabinet.appointments.minutes')}
                            </span>
                          )}
                          {apt.services?.[0]?.price_uah &&
                            apt.services[0].price_uah > 0 && (
                              <span className="font-medium text-slate-700">
                                {apt.services[0].price_uah.toLocaleString(
                                  'uk-UA'
                                )}{' '}
                                {t('cabinet.appointments.currency')}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(apt.status)}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {cancellingId === apt.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          {t('cabinet.appointments.cancel')}
                        </button>
                      )}
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">
                          {t('cabinet.appointments.notes')}:
                        </span>{' '}
                        {apt.notes}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
