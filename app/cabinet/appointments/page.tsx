'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar,
  Clock,
  Filter,
  Plus,
  X,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  doctors: { first_name: string; last_name: string; specialization: string }[]
  services: { name_uk: string; price_uah: number; duration_minutes: number }[]
}

function AppointmentsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-dental-secondary-200 rounded-lg" />
        <div className="h-10 w-44 bg-dental-primary-100 rounded-xl" />
      </div>
      {/* Filter skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-10 w-24 bg-dental-secondary-100 rounded-xl"
          />
        ))}
      </div>
      {/* Cards skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-6 space-y-3">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-dental-secondary-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-dental-secondary-200 rounded" />
              <div className="h-4 w-64 bg-dental-secondary-100 rounded" />
              <div className="h-4 w-32 bg-dental-secondary-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ——— Reschedule Modal ——— */

function RescheduleModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment
  onClose: () => void
  onSuccess: (id: string, newDate: string, newTime: string) => void
}) {
  const { t } = useTranslation()
  const { getHeaders } = useCSRF()

  const [selectedDate, setSelectedDate] = useState(appointment.appointment_date)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calendar navigation
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(appointment.appointment_date)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setSlots([])
    setSelectedTime(null)
    try {
      const res = await fetch(`/api/appointments/slots?date=${date}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, fetchSlots])

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/appointments/${appointment.id}/reschedule`,
        {
          method: 'PATCH',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            newDate: selectedDate,
            newTime: selectedTime,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            t('cabinet.appointments.reschedule.error', {
              defaultValue: 'Не вдалося перенести запис',
            })
        )
        setSubmitting(false)
        return
      }

      onSuccess(appointment.id, selectedDate, selectedTime)
    } catch {
      setError(
        t('cabinet.appointments.reschedule.error', {
          defaultValue: 'Не вдалося перенести запис',
        })
      )
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(
    calendarMonth.year,
    calendarMonth.month + 1,
    0
  ).getDate()
  const firstDayOfWeek =
    (new Date(calendarMonth.year, calendarMonth.month, 1).getDay() + 6) % 7 // Mon=0

  const canGoPrev =
    calendarMonth.year > today.getFullYear() ||
    (calendarMonth.year === today.getFullYear() &&
      calendarMonth.month > today.getMonth())

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dental-dark/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dental-secondary-100">
          <h3 className="text-lg font-semibold text-dental-dark">
            {t('cabinet.appointments.reschedule.title', {
              defaultValue: 'Перенести запис',
            })}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current appointment info */}
          <div className="bg-dental-secondary-50 rounded-xl p-3">
            <p className="text-xs text-dental-muted mb-1">
              {t('cabinet.appointments.reschedule.current', {
                defaultValue: 'Поточний запис',
              })}
            </p>
            <p className="text-sm font-medium text-dental-dark">
              {new Date(appointment.appointment_date).toLocaleDateString(
                'uk-UA',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}{' '}
              {t('cabinet.appointments.reschedule.at', {
                defaultValue: 'о',
              })}{' '}
              {appointment.appointment_time.slice(0, 5)}
            </p>
          </div>

          {/* Mini calendar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() =>
                  setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month - 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })
                }
                disabled={!canGoPrev}
                className="p-1.5 rounded-lg hover:bg-dental-secondary-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-dental-muted" />
              </button>
              <span className="text-sm font-medium text-dental-dark capitalize">
                {new Date(
                  calendarMonth.year,
                  calendarMonth.month
                ).toLocaleDateString('uk-UA', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() =>
                  setCalendarMonth(prev => {
                    const d = new Date(prev.year, prev.month + 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })
                }
                className="p-1.5 rounded-lg hover:bg-dental-secondary-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-dental-muted" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map(d => (
                <div
                  key={d}
                  className="text-[10px] font-medium text-dental-muted py-1"
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dateObj = new Date(
                  calendarMonth.year,
                  calendarMonth.month,
                  day
                )
                const isPast = dateObj < today
                const isSunday = dateObj.getDay() === 0
                const isSelected = dateStr === selectedDate
                const isDisabled = isPast || isSunday

                return (
                  <button
                    key={day}
                    disabled={isDisabled}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`text-xs py-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-dental-primary-600 text-white font-semibold'
                        : isDisabled
                          ? 'text-dental-secondary-200 cursor-not-allowed'
                          : 'text-dental-dark hover:bg-dental-primary-50'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <p className="text-sm font-medium text-dental-dark mb-2">
              {t('cabinet.appointments.reschedule.selectTime', {
                defaultValue: 'Оберіть час',
              })}
            </p>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-dental-muted text-center py-4">
                {t('cabinet.appointments.reschedule.noSlots', {
                  defaultValue: 'Немає доступних слотів на цю дату',
                })}
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`text-sm py-2 rounded-xl transition-colors font-medium ${
                      selectedTime === slot
                        ? 'bg-dental-primary-600 text-white'
                        : 'bg-dental-secondary-50 text-dental-dark hover:bg-dental-primary-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-dental-secondary-200 text-dental-dark font-medium hover:bg-dental-secondary-50 transition-colors"
            >
              {t('common.cancel', { defaultValue: 'Скасувати' })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || submitting}
              className="flex-1 py-3 rounded-xl bg-dental-primary-600 text-white font-medium hover:bg-dental-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  {t('cabinet.appointments.reschedule.confirm', {
                    defaultValue: 'Перенести',
                  })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ——— Main Page ——— */

export default function AppointmentsPage() {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('appointments')
        .select(
          `id, appointment_date, appointment_time, status, notes,
          doctors (first_name, last_name, specialization),
          services (name_uk, price_uah, duration_minutes)`
        )
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false })

      setAppointments(data || [])
      setLoading(false)
    }

    fetchAppointments()
  }, [])

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

  const handleRescheduleSuccess = (
    id: string,
    newDate: string,
    newTime: string
  ) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id
          ? {
              ...apt,
              appointment_date: newDate,
              appointment_time: newTime + ':00',
              status: 'pending',
            }
          : apt
      )
    )
    setRescheduleApt(null)
  }

  const filteredAppointments = appointments.filter(apt => {
    const isUpcoming = new Date(apt.appointment_date) >= new Date()
    if (filter === 'upcoming') return isUpcoming && apt.status !== 'cancelled'
    if (filter === 'past') return !isUpcoming || apt.status === 'completed'
    return true
  })

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
        {t(`cabinet.appointments.status.${status}`, status)}
      </span>
    )
  }

  if (loading) return <AppointmentsSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dental-dark">
          {t('cabinet.appointments.title')}
        </h1>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('cabinet.appointments.newAppointment')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-dental-muted" />
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-dental-primary-100 text-dental-primary-600'
                  : 'bg-white text-dental-muted hover:bg-dental-secondary-50 border border-dental-secondary-100'
              }`}
            >
              {t(`cabinet.appointments.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dental-secondary-100">
          <Calendar className="w-16 h-16 text-dental-secondary-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dental-dark mb-1">
            {t(`cabinet.appointments.empty.${filter}`)}
          </h3>
          <p className="text-dental-muted text-sm mb-6">
            {t('cabinet.appointments.empty.cta')}
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('cabinet.appointments.book')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map(apt => {
            const isUpcoming = new Date(apt.appointment_date) >= new Date()
            const canModify =
              isUpcoming &&
              apt.status !== 'cancelled' &&
              apt.status !== 'completed'

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-dental-secondary-100 transition-colors hover:border-dental-primary-200 ${
                  apt.status === 'cancelled' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-dental-primary-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg sm:text-xl font-bold text-dental-primary-600 leading-none">
                        {new Date(apt.appointment_date).getDate()}
                      </span>
                      <span className="text-[10px] sm:text-xs text-dental-primary-500">
                        {new Date(apt.appointment_date).toLocaleDateString(
                          'uk-UA',
                          { month: 'short' }
                        )}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-dental-dark mb-0.5">
                        {apt.services?.[0]?.name_uk ||
                          t('cabinet.appointments.consultation')}
                      </h3>
                      <p className="text-sm text-dental-muted mb-2">
                        {apt.doctors?.[0]?.last_name}{' '}
                        {apt.doctors?.[0]?.first_name}
                        {apt.doctors?.[0]?.specialization &&
                          ` — ${apt.doctors[0].specialization}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dental-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
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
                            <span className="font-medium text-dental-dark">
                              {apt.services[0].price_uah.toLocaleString(
                                'uk-UA'
                              )}{' '}
                              {t('cabinet.appointments.currency')}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                    {getStatusBadge(apt.status)}
                    {canModify && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRescheduleApt(apt)}
                          className="flex items-center gap-1 text-xs text-dental-primary-600 hover:text-dental-primary-700 transition-colors"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          {t('cabinet.appointments.reschedule.button', {
                            defaultValue: 'Перенести',
                          })}
                        </button>
                        <span className="text-dental-secondary-200">|</span>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === apt.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          {t('cabinet.appointments.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {apt.notes && (
                  <div className="mt-4 pt-3 border-t border-dental-secondary-100">
                    <p className="text-xs text-dental-muted">
                      <span className="font-medium text-dental-dark">
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

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <RescheduleModal
          appointment={rescheduleApt}
          onClose={() => setRescheduleApt(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  )
}
