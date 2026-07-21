'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select, Skeleton } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { can } from '@/lib/permissions'
import { useConfirm, type ConfirmOptions } from '@/hooks/useConfirm'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { TableSkeleton } from '@/components/ui'
import AdminDataCard from '@/components/admin/AdminDataCard'
import {
  formatDate,
  formatDateTime,
  formatTime,
  getJoinedFieldValue,
  getStatusTone,
  type JoinedField,
} from './utils'

type AppointmentStatus =
  'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

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
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { preferences } = useAdminPreferences()
  const { user } = useAdminAuth()
  const { confirm, confirmDialog } = useConfirm()
  const isDoctor = user?.role === 'doctor'
  // RBAC-гейт дій (Р1): міняти статус можуть лише ролі з appointments:edit
  const canEdit = user ? can(user.role, 'appointments:edit') : false
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
        setError(t('admin.appointmentsPage.errors.supabaseUnavailable'))
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

        // Defense-in-depth: RLS already scopes doctors, but apply the filter
        // at the app layer too so any RLS regression doesn't silently leak data.
        if (isDoctor && user?.doctorId) {
          query = query.eq('doctor_id', user.doctorId)
        }

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
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.appointmentsPage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [dateFilter, isDoctor, searchTerm, statusFilter, t, user?.doctorId]
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
  const tableHeadClass = `${tableCellClass} text-left text-xs font-semibold uppercase text-dental-muted`
  const tableEmptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-muted`
  const getStatusLabel = useCallback(
    (status: AppointmentStatus) => t(`admin.appointmentStatuses.${status}`),
    [t]
  )

  const confirmIfNeeded = useCallback(
    async (opts: ConfirmOptions) => {
      if (!preferences.confirmSensitiveActions) return true
      return confirm(opts)
    },
    [preferences.confirmSensitiveActions, confirm]
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
      !(await confirmIfNeeded({
        title: t('admin.appointmentsPage.confirmations.bulkStatusChange', {
          count: selectedIds.length,
          status: getStatusLabel(bulkStatus),
        }),
        severity: 'significant',
        confirmLabel: t('common.confirm'),
      }))
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
      captureException(
        updateError instanceof Error
          ? updateError
          : new Error(String(updateError))
      )
      setError(t('admin.appointmentsPage.errors.bulkUpdateFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const updateStatus = useCallback(
    async (id: string, nextStatus: AppointmentStatus) => {
      if (
        !(await confirmIfNeeded({
          title: t('admin.appointmentsPage.confirmations.singleStatusChange', {
            status: getStatusLabel(nextStatus),
          }),
          severity: 'significant',
          confirmLabel: t('common.confirm'),
        }))
      ) {
        return
      }

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
        captureException(
          updateError instanceof Error
            ? updateError
            : new Error(String(updateError))
        )
        setError(t('admin.appointmentsPage.errors.statusUpdateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [
      confirmIfNeeded,
      getStatusLabel,
      loadAppointments,
      preferences.autoRefreshLists,
      t,
    ]
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
      {confirmDialog}
      {isDoctor && (
        <div className="rounded-xl border border-dental-info/30 bg-dental-info-light px-4 py-3 text-sm text-dental-info-dark">
          {t('admin.appointmentsPage.doctorScopeNotice')}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.appointmentsPage.title')}
          </h1>
          <p className="text-sm text-dental-muted">
            {t('admin.appointmentsPage.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadAppointments(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.appointmentsPage.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-muted">
            {t('admin.appointmentsPage.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-muted">
            {t('admin.appointmentsPage.summary.today')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">
            {summary.todayCount}
          </p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-muted">
            {t('admin.appointmentsPage.summary.pending')}
          </p>
          <p className="text-2xl font-bold text-status-warning-700">
            {summary.pending}
          </p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-muted">
            {t('admin.appointmentsPage.summary.completed')}
          </p>
          <p className="text-2xl font-bold text-status-success-700">
            {summary.completed}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.appointmentsPage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <Select
            selectSize="compact"
            fullWidth
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value as 'all' | AppointmentStatus)
            }
            aria-label={t('admin.appointmentsPage.filters.statusSelectAria')}
          >
            <option value="all">
              {t('admin.appointmentsPage.filters.allStatuses')}
            </option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            selectSize="compact"
            fullWidth
            value={dateFilter}
            onChange={event => setDateFilter(event.target.value as DateFilter)}
            aria-label={t('admin.appointmentsPage.filters.dateSelectAria')}
          >
            <option value="all">
              {t('admin.appointmentsPage.filters.allDates')}
            </option>
            <option value="today">
              {t('admin.appointmentsPage.filters.today')}
            </option>
            <option value="upcoming">
              {t('admin.appointmentsPage.filters.upcoming')}
            </option>
            <option value="past">
              {t('admin.appointmentsPage.filters.past')}
            </option>
          </Select>
        </div>
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
          <span className="text-sm text-dental-muted">
            {t('admin.appointmentsPage.bulk.selected', {
              count: selectedIds.length,
            })}
          </span>
          <Select
            selectSize="compact"
            value={bulkStatus}
            onChange={event =>
              setBulkStatus(event.target.value as AppointmentStatus)
            }
            aria-label={t('admin.appointmentsPage.bulk.apply')}
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {t('admin.appointmentsPage.bulk.moveTo', {
                  status: getStatusLabel(status),
                })}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            onClick={() => void applyBulkStatus()}
            disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
            isLoading={isUpdatingId === 'bulk'}
          >
            {t('admin.appointmentsPage.bulk.apply')}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-dental-error/20 bg-status-error-100 px-4 py-3 text-sm text-status-error-700">
          {error}
        </div>
      )}

      {/* Desktop table — lg and above */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-dental-secondary-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dental-secondary-200">
            <thead className="bg-dental-secondary-50">
              <tr>
                <th className={tableHeadClass}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('admin.appointmentsPage.table.selectAllAria')}
                  />
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.patient')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.contacts')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.service')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.doctor')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.dateTime')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.status')}
                </th>
                <th className={tableHeadClass}>
                  {t('admin.appointmentsPage.table.headers.createdAt')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dental-secondary-100 bg-white text-sm">
              {isLoading ? (
                <TableSkeleton cols={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={tableEmptyStateClass}>
                    {t('admin.appointmentsPage.table.empty')}
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
                        aria-label={t(
                          'admin.appointmentsPage.table.selectRowAria',
                          {
                            name: resolvePatientName(row),
                          }
                        )}
                      />
                    </td>
                    <td className={tableCellClass}>
                      <div className="font-medium text-dental-dark">
                        {resolvePatientName(row)}
                      </div>
                      {row.notes ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-dental-muted">
                          {row.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className={tableCellClass}>
                      <div>{row.guest_phone || '—'}</div>
                      <div className="text-xs text-dental-muted">
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
                      <div className="text-xs text-dental-muted">
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
                          {getStatusLabel(row.status)}
                        </span>
                        {canEdit && (
                          <Select
                            selectSize="dense"
                            fullWidth
                            value={row.status}
                            onChange={event =>
                              void updateStatus(
                                row.id,
                                event.target.value as AppointmentStatus
                              )
                            }
                            disabled={isUpdatingId === row.id}
                            aria-label={`${t('admin.appointmentsPage.table.headers.status')}: ${resolvePatientName(row)}`}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                    </td>
                    <td
                      className={`${tableCellClass} text-xs text-dental-muted`}
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

      {/* Mobile / tablet card list — below lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))
        ) : rows.length === 0 ? (
          <p className="col-span-full text-center py-8 text-dental-muted">
            {t('admin.appointmentsPage.table.empty')}
          </p>
        ) : (
          rows.map(row => (
            <AdminDataCard
              key={row.id}
              selected={selectedSet.has(row.id)}
              onSelect={() => toggleSelection(row.id)}
              title={resolvePatientName(row)}
              subtitle={
                <span className="flex flex-col gap-0.5">
                  <span className="truncate">{resolveServiceName(row)}</span>
                  <span className="text-dental-muted truncate">
                    {resolveDoctorName(row)}
                  </span>
                </span>
              }
              meta={`${formatDate(row.appointment_date)} · ${formatTime(row.appointment_time)}`}
              badge={
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusTone(row.status)}`}
                >
                  {getStatusLabel(row.status)}
                </span>
              }
              actions={
                canEdit ? (
                  <Select
                    selectSize="dense"
                    fullWidth
                    value={row.status}
                    onChange={e =>
                      void updateStatus(
                        row.id,
                        e.target.value as AppointmentStatus
                      )
                    }
                    disabled={isUpdatingId === row.id}
                    aria-label={`${t('admin.appointmentsPage.table.headers.status')}: ${resolvePatientName(row)}`}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                ) : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
