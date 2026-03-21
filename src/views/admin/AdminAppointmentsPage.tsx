'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import {
  formatDate,
  formatDateTime,
  formatTime,
  getJoinedFieldValue,
  getStatusTone,
  type JoinedField,
} from './utils'

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

interface AppointmentRow {
  id: string
  patient_name: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  source: string | null
  created_at: string
  notes: string | null
  services: JoinedField
  doctors: JoinedField
}

type DateFilter = 'all' | 'today' | 'upcoming' | 'past'

const STATUS_OPTIONS: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

export default function AdminAppointmentsPage() {
  const searchParams = useSearchParams()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<AppointmentRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>(
    'all'
  )
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [bulkStatus, setBulkStatus] = useState<AppointmentStatus>('confirmed')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'today') {
      setDateFilter('today')
    }
  }, [searchParams])

  const loadAppointments = useCallback(
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
        let query = supabase
          .from('appointments')
          .select(
            'id, patient_name, guest_name, guest_phone, guest_email, appointment_date, appointment_time, status, source, created_at, notes, services(name_uk), doctors(first_name,last_name)'
          )

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const today = new Date().toISOString().slice(0, 10)
        if (dateFilter === 'today') {
          query = query.eq('appointment_date', today)
        } else if (dateFilter === 'upcoming') {
          query = query.gte('appointment_date', today)
        } else if (dateFilter === 'past') {
          query = query.lt('appointment_date', today)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `patient_name.ilike.%${normalizedSearch}%,guest_name.ilike.%${normalizedSearch}%,guest_phone.ilike.%${normalizedSearch}%,guest_email.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })
          .limit(300)

        if (queryError) {
          throw queryError
        }

        setRows((data || []) as AppointmentRow[])
      } catch (loadError) {
        console.error('Failed to load appointments:', loadError)
        setError('Не вдалося завантажити записи. Спробуйте ще раз.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [dateFilter, searchTerm, statusFilter]
  )

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  useEffect(() => {
    const visibleIds = new Set(rows.map(row => row.id))
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)))
  }, [rows])

  const summary = useMemo(() => {
    const total = rows.length
    const pending = rows.filter(row => row.status === 'pending').length
    const completed = rows.filter(row => row.status === 'completed').length
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = rows.filter(row => row.appointment_date === today).length
    return { total, pending, completed, todayCount }
  }, [rows])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    rows.length > 0 && rows.every(row => selectedSet.has(row.id))
  const tableCellClass = preferences.compactTables ? 'px-3 py-2' : 'px-4 py-3'
  const tableHeadClass = `${tableCellClass} text-left text-xs font-semibold uppercase text-gray-500`
  const tableEmptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-text-light`

  const confirmIfNeeded = useCallback(
    (message: string) => {
      if (!preferences.confirmSensitiveActions) return true
      return window.confirm(message)
    },
    [preferences.confirmSensitiveActions]
  )

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(rows.map(row => row.id))
  }

  const applyBulkStatus = async () => {
    if (selectedIds.length === 0) return
    if (
      !confirmIfNeeded(
        `Змінити статус для ${selectedIds.length} запис(ів) на "${bulkStatus}"?`
      )
    ) {
      return
    }

    const supabase = createClient()
    if (!supabase) return

    setIsUpdatingId('bulk')
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: bulkStatus })
        .in('id', selectedIds)
      if (updateError) throw updateError

      setSelectedIds([])
      if (preferences.autoRefreshLists) {
        await loadAppointments(true)
        return
      }

      setRows(prev =>
        prev.map(row =>
          selectedSet.has(row.id) ? { ...row, status: bulkStatus } : row
        )
      )
    } catch (updateError) {
      console.error('Failed to apply bulk appointment status:', updateError)
      setError('Не вдалося застосувати масову зміну статусу.')
    } finally {
      setIsUpdatingId(null)
    }
  }

  const updateStatus = useCallback(
    async (id: string, nextStatus: AppointmentStatus) => {
      if (!confirmIfNeeded(`Оновити статус запису на "${nextStatus}"?`)) return

      const supabase = createClient()
      if (!supabase) return

      setIsUpdatingId(id)
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ status: nextStatus })
          .eq('id', id)

        if (updateError) {
          throw updateError
        }

        if (preferences.autoRefreshLists) {
          await loadAppointments(true)
          return
        }

        setRows(prev =>
          prev.map(row =>
            row.id === id ? { ...row, status: nextStatus } : row
          )
        )
      } catch (updateError) {
        console.error('Failed to update appointment status:', updateError)
        setError('Не вдалося оновити статус запису.')
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadAppointments, preferences.autoRefreshLists]
  )

  const resolvePatientName = (row: AppointmentRow) => {
    const value = row.patient_name || row.guest_name
    return value?.trim() || '—'
  }

  const resolveDoctorName = (row: AppointmentRow) => {
    const firstName = getJoinedFieldValue(row.doctors, 'first_name', '')
    const lastName = getJoinedFieldValue(row.doctors, 'last_name', '')
    const fullName = `${lastName} ${firstName}`.trim()
    return fullName || '—'
  }

  const resolveServiceName = (row: AppointmentRow) =>
    getJoinedFieldValue(row.services, 'name_uk')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            Управління записами
          </h1>
          <p className="text-sm text-dental-text-light">
            Пошук, фільтрація та зміна статусів прийомів у реальному часі.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAppointments(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Оновити
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Всього</p>
          <p className="text-2xl font-bold text-dental-dark">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Сьогодні</p>
          <p className="text-2xl font-bold text-dental-dark">
            {summary.todayCount}
          </p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Очікують</p>
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Завершено</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.completed}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Пошук: ім'я, телефон, email"
            className="md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value as 'all' | AppointmentStatus)
            }
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Усі статуси</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="no_show">no_show</option>
          </select>
          <select
            value={dateFilter}
            onChange={event => setDateFilter(event.target.value as DateFilter)}
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Всі дати</option>
            <option value="today">Сьогодні</option>
            <option value="upcoming">Майбутні</option>
            <option value="past">Минулі</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          Вибрано: {selectedIds.length}
        </span>
        <select
          value={bulkStatus}
          onChange={event =>
            setBulkStatus(event.target.value as AppointmentStatus)
          }
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>
              Перевести в {status}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => void applyBulkStatus()}
          disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
          isLoading={isUpdatingId === 'bulk'}
        >
          Застосувати масово
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dental-secondary-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={tableHeadClass}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Вибрати всі рядки"
                  />
                </th>
                <th className={tableHeadClass}>Пацієнт</th>
                <th className={tableHeadClass}>Контакти</th>
                <th className={tableHeadClass}>Послуга</th>
                <th className={tableHeadClass}>Лікар</th>
                <th className={tableHeadClass}>Дата/час</th>
                <th className={tableHeadClass}>Статус</th>
                <th className={tableHeadClass}>Створено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    Завантаження записів...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    За поточними фільтрами нічого не знайдено.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="align-top">
                    <td className={tableCellClass}>
                      <input
                        type="checkbox"
                        checked={selectedSet.has(row.id)}
                        onChange={() => toggleSelection(row.id)}
                        aria-label={`Вибрати запис ${resolvePatientName(row)}`}
                      />
                    </td>
                    <td className={tableCellClass}>
                      <div className="font-medium text-dental-dark">
                        {resolvePatientName(row)}
                      </div>
                      {row.notes ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-dental-text-light">
                          {row.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className={tableCellClass}>
                      <div>{row.guest_phone || '—'}</div>
                      <div className="text-xs text-dental-text-light">
                        {row.guest_email || '—'}
                      </div>
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {resolveServiceName(row)}
                    </td>
                    <td className={`${tableCellClass} text-dental-text`}>
                      {resolveDoctorName(row)}
                    </td>
                    <td className={tableCellClass}>
                      <div>{formatDate(row.appointment_date)}</div>
                      <div className="text-xs text-dental-text-light">
                        {formatTime(row.appointment_time)}
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                        <select
                          value={row.status}
                          onChange={event =>
                            void updateStatus(
                              row.id,
                              event.target.value as AppointmentStatus
                            )
                          }
                          disabled={isUpdatingId === row.id}
                          className="rounded-md border border-dental-secondary px-2 py-1 text-xs"
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td
                      className={`${tableCellClass} text-xs text-dental-text-light`}
                    >
                      <div>{formatDateTime(row.created_at)}</div>
                      <div className="mt-1">{row.source || '—'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
