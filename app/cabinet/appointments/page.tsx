'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  Check,
  AlertTriangle,
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

/* ——— Toast Notification ——— */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 fade-in duration-300"
    >
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border ${
          type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        {type === 'success' ? (
          <Check className="w-5 h-5 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 shrink-0" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="ml-2 p-0.5 rounded hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-current"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ——— Cancel Confirmation Modal ——— */

function CancelConfirmModal({
  appointment,
  onClose,
  onConfirm,
  cancelling,
}: {
  appointment: Appointment
  onClose: () => void
  onConfirm: () => void
  cancelling: boolean
}) {
  const { t, i18n } = useTranslation()
  const dateLocale =
    (i18n.language || 'uk') === 'uk'
      ? 'uk-UA'
      : (i18n.language || 'uk') === 'pl'
        ? 'pl-PL'
        : 'en-US'

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div
        className="absolute inset-0 bg-dental-dark/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3
            id="cancel-modal-title"
            className="text-lg font-semibold text-dental-dark mb-2"
          >
            {t('cabinet.appointments.cancelModal.title')}
          </h3>
          <p className="text-sm text-dental-muted mb-2">
            {t('cabinet.appointments.cancelConfirm')}
          </p>
          <div className="bg-dental-secondary-50 rounded-xl p-3 mb-6">
            <p className="text-sm font-medium text-dental-dark">
              {appointment.services?.[0]?.name_uk ||
                t('cabinet.appointments.consultation')}
            </p>
            <p className="text-xs text-dental-muted mt-0.5">
              {new Date(appointment.appointment_date).toLocaleDateString(
                dateLocale,
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}{' '}
              {t('cabinet.appointments.reschedule.at')}{' '}
              {appointment.appointment_time.slice(0, 5)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 py-3 rounded-xl border border-dental-secondary-200 text-dental-dark font-medium hover:bg-dental-secondary-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
            >
              {t('cabinet.appointments.cancelModal.back')}
            </button>
            <button
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {cancelling ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4" />
                  {t('cabinet.appointments.cancelModal.confirm')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
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
  const { t, i18n } = useTranslation()
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
        setError(data.error || t('cabinet.appointments.reschedule.error'))
        setSubmitting(false)
        return
      }

      onSuccess(appointment.id, selectedDate, selectedTime)
    } catch {
      setError(t('cabinet.appointments.reschedule.error'))
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

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

  // i18n weekday names
  const locale = i18n.language || 'uk'
  const dateLocale =
    locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US'
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    // Mon=0 to Sun=6 → JS Date: Mon=1, Tue=2, ..., Sun=0
    // Use a known Monday: 2024-01-01
    const d = new Date(2024, 0, 1 + i)
    return d
      .toLocaleDateString(dateLocale, {
        weekday: 'short',
      })
      .replace('.', '')
  })

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div
        className="absolute inset-0 bg-dental-dark/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dental-secondary-100">
          <h3
            id="reschedule-modal-title"
            className="text-lg font-semibold text-dental-dark"
          >
            {t('cabinet.appointments.reschedule.title')}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Закрити' })}
            className="p-1.5 rounded-lg text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current appointment info */}
          <div className="bg-dental-secondary-50 rounded-xl p-3">
            <p className="text-xs text-dental-muted mb-1">
              {t('cabinet.appointments.reschedule.current')}
            </p>
            <p className="text-sm font-medium text-dental-dark">
              {new Date(appointment.appointment_date).toLocaleDateString(
                dateLocale,
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}{' '}
              {t('cabinet.appointments.reschedule.at')}{' '}
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
                aria-label={t('common.previous', {
                  defaultValue: 'Попередній',
                })}
                className="p-1.5 rounded-lg hover:bg-dental-secondary-50 disabled:opacity-30 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
              >
                <ChevronLeft className="w-4 h-4 text-dental-muted" />
              </button>
              <span className="text-sm font-medium text-dental-dark capitalize">
                {new Date(
                  calendarMonth.year,
                  calendarMonth.month
                ).toLocaleDateString(dateLocale, {
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
                aria-label={t('common.next', { defaultValue: 'Наступний' })}
                className="p-1.5 rounded-lg hover:bg-dental-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
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
                const isToday = dateStr === todayStr
                const isDisabled = isPast || isSunday

                return (
                  <button
                    key={day}
                    disabled={isDisabled}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative text-xs py-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-dental-primary-600 text-white font-semibold'
                        : isDisabled
                          ? 'text-dental-secondary-200 cursor-not-allowed'
                          : isToday
                            ? 'text-dental-primary-600 font-semibold ring-1 ring-dental-primary-400 hover:bg-dental-primary-50'
                            : 'text-dental-dark hover:bg-dental-primary-50'
                    }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-dental-primary-600 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <p className="text-sm font-medium text-dental-dark mb-2">
              {t('cabinet.appointments.reschedule.selectTime')}
            </p>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-dental-muted text-center py-4">
                {t('cabinet.appointments.reschedule.noSlots')}
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
              className="flex-1 py-3 rounded-xl border border-dental-secondary-200 text-dental-dark font-medium hover:bg-dental-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
            >
              {t('common.cancel', { defaultValue: 'Скасувати' })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || submitting}
              className="flex-1 py-3 rounded-xl bg-dental-primary-600 text-white font-medium hover:bg-dental-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  {t('cabinet.appointments.reschedule.confirm')}
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
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const initialFilter = (['all', 'upcoming', 'past'] as const).includes(
    searchParams.get('filter') as 'all' | 'upcoming' | 'past'
  )
    ? (searchParams.get('filter') as 'all' | 'upcoming' | 'past')
    : 'all'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>(
    initialFilter
  )
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null)
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const supabase = createClient()
        if (!supabase) return

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('appointments')
          .select(
            `id, appointment_date, appointment_time, status, notes,
            doctors (first_name, last_name, specialization),
            services (name_uk, price_uah, duration_minutes)`
          )
          .eq('patient_id', user.id)
          .order('appointment_date', { ascending: false })

        if (error) {
          console.error('Appointments fetch error:', error)
          setFetchError(true)
        }

        setAppointments(data || [])
        setLoading(false)
      } catch (err) {
        console.error('Appointments fetch error:', err)
        setFetchError(true)
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  const handleCancelConfirm = async () => {
    if (!cancelApt) return
    const id = cancelApt.id

    setCancellingId(id)
    const supabase = createClient()
    if (!supabase) return

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      setToast({
        message: t('cabinet.appointments.cancelModal.error'),
        type: 'error',
      })
    } else {
      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, status: 'cancelled' } : apt))
      )
      setToast({
        message: t('cabinet.appointments.cancelModal.success'),
        type: 'success',
      })
    }
    setCancellingId(null)
    setCancelApt(null)
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
    setToast({
      message: t('cabinet.appointments.reschedule.success'),
      type: 'success',
    })
  }

  // Filter counts
  const counts = {
    all: appointments.length,
    upcoming: appointments.filter(apt => {
      const isUpcoming = new Date(apt.appointment_date) >= new Date()
      return (
        isUpcoming && apt.status !== 'cancelled' && apt.status !== 'completed'
      )
    }).length,
    past: appointments.filter(apt => {
      const isUpcoming = new Date(apt.appointment_date) >= new Date()
      return (
        !isUpcoming || apt.status === 'completed' || apt.status === 'cancelled'
      )
    }).length,
  }

  const filteredAppointments = appointments.filter(apt => {
    const isUpcoming = new Date(apt.appointment_date) >= new Date()
    if (filter === 'upcoming')
      return (
        isUpcoming && apt.status !== 'cancelled' && apt.status !== 'completed'
      )
    if (filter === 'past')
      return (
        !isUpcoming || apt.status === 'completed' || apt.status === 'cancelled'
      )
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

  // Locale helpers
  const locale = i18n.language || 'uk'
  const dateLocale =
    locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US'
  const getDayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    return d
      .toLocaleDateString(dateLocale, { weekday: 'short' })
      .replace('.', '')
  }

  if (loading) return <AppointmentsSkeleton />

  if (fetchError && appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center shadow-sm border border-red-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-dental-dark mb-2">
          {t('cabinet.error.title')}
        </h2>
        <p className="text-dental-muted text-sm mb-6">
          {t('cabinet.error.description')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
        >
          {t('cabinet.error.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dental-dark">
          {t('cabinet.appointments.title')}
        </h1>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
        >
          <Plus className="w-4 h-4" />
          {t('cabinet.appointments.newAppointment')}
        </Link>
      </div>

      {/* Filters with counts */}
      <div className="flex items-center gap-2">
        <Filter
          className="w-4 h-4 text-dental-muted shrink-0"
          aria-hidden="true"
        />
        <div
          className="flex gap-2 overflow-x-auto"
          role="tablist"
          aria-label={t('cabinet.appointments.filters.all')}
        >
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-dental-primary-500 ${
                filter === f
                  ? 'bg-dental-primary-100 text-dental-primary-600'
                  : 'bg-white text-dental-muted hover:bg-dental-secondary-50 border border-dental-secondary-100'
              }`}
            >
              {t(`cabinet.appointments.filters.${f}`)}
              <span
                className={`ml-1.5 text-xs ${
                  filter === f
                    ? 'text-dental-primary-500'
                    : 'text-dental-secondary-300'
                }`}
              >
                ({counts[f]})
              </span>
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
            className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-700"
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
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-dental-secondary-100 transition-colors hover:border-dental-primary-200 ${
                  apt.status === 'cancelled' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Date block with day-of-week */}
                    <div className="w-14 h-16 sm:w-16 sm:h-[4.5rem] bg-dental-primary-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-dental-primary-500 font-medium uppercase leading-none">
                        {getDayOfWeek(apt.appointment_date)}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-dental-primary-600 leading-tight">
                        {new Date(apt.appointment_date).getDate()}
                      </span>
                      <span className="text-[10px] sm:text-xs text-dental-primary-500 leading-none">
                        {new Date(apt.appointment_date).toLocaleDateString(
                          dateLocale,
                          { month: 'short' }
                        )}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-dental-dark mb-0.5 truncate">
                        {apt.services?.[0]?.name_uk ||
                          t('cabinet.appointments.consultation')}
                      </h3>
                      <p className="text-sm text-dental-muted mb-2 truncate">
                        {apt.doctors?.[0]?.last_name}{' '}
                        {apt.doctors?.[0]?.first_name}
                        {apt.doctors?.[0]?.specialization &&
                          ` — ${apt.doctors[0].specialization}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dental-muted">
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
                                dateLocale
                              )}{' '}
                              {t('cabinet.appointments.currency')}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2 ml-[calc(3.5rem+0.75rem)] sm:ml-0">
                    {getStatusBadge(apt.status)}
                    {canModify && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => setRescheduleApt(apt)}
                          aria-label={t(
                            'cabinet.appointments.reschedule.button'
                          )}
                          className="flex items-center gap-1 text-xs px-2 py-1 sm:px-0 sm:py-0 rounded-lg sm:rounded-none bg-dental-primary-50 sm:bg-transparent text-dental-primary-600 hover:text-dental-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {t('cabinet.appointments.reschedule.button')}
                          </span>
                        </button>
                        <span
                          className="hidden sm:inline text-dental-secondary-200"
                          aria-hidden="true"
                        >
                          |
                        </span>
                        <button
                          onClick={() => setCancelApt(apt)}
                          disabled={cancellingId === apt.id}
                          aria-label={t('cabinet.appointments.cancel')}
                          className="flex items-center gap-1 text-xs px-2 py-1 sm:px-0 sm:py-0 rounded-lg sm:rounded-none bg-red-50 sm:bg-transparent text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {t('cabinet.appointments.cancel')}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {apt.notes && (
                  <div className="mt-3 pt-3 border-t border-dental-secondary-100 ml-[calc(3.5rem+0.75rem)] sm:ml-0">
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

      {/* Cancel Confirmation Modal */}
      {cancelApt && (
        <CancelConfirmModal
          appointment={cancelApt}
          onClose={() => setCancelApt(null)}
          onConfirm={handleCancelConfirm}
          cancelling={cancellingId === cancelApt.id}
        />
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
