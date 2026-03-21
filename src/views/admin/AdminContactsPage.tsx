'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, getStatusTone } from './utils'

interface ContactRow {
  id: string
  name: string
  phone: string
  email: string | null
  message: string | null
  status: string
  is_read: boolean
  admin_notes: string | null
  created_at: string
}

type ReadFilter = 'all' | 'unread' | 'read'

const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed']

export default function AdminContactsPage() {
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<ContactRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('unread')
  const [bulkStatus, setBulkStatus] = useState('in_progress')
  const [bulkReadState, setBulkReadState] = useState<'read' | 'unread'>('read')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadContacts = useCallback(
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
          .from('contact_submissions')
          .select(
            'id, name, phone, email, message, status, is_read, admin_notes, created_at'
          )

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (readFilter === 'unread') {
          query = query.eq('is_read', false)
        } else if (readFilter === 'read') {
          query = query.eq('is_read', true)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%,message.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('created_at', { ascending: false })
          .limit(300)

        if (queryError) throw queryError

        setRows((data || []) as ContactRow[])
      } catch (loadError) {
        console.error('Failed to load contacts:', loadError)
        setError('Не вдалося завантажити звернення.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [readFilter, searchTerm, statusFilter]
  )

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  useEffect(() => {
    const visibleIds = new Set(rows.map(row => row.id))
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)))
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const unread = rows.filter(row => !row.is_read).length
    const inProgress = rows.filter(row => row.status === 'in_progress').length
    const resolved = rows.filter(row => row.status === 'resolved').length
    return { total, unread, inProgress, resolved }
  }, [rows])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    rows.length > 0 && rows.every(row => selectedSet.has(row.id))
  const cardPaddingClass = preferences.compactTables ? 'p-3' : 'p-4'
  const emptyStateClass = `${
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

  const applyBulkChanges = async () => {
    if (selectedIds.length === 0) return
    if (
      !confirmIfNeeded(
        `Застосувати масову зміну до ${selectedIds.length} звернень?`
      )
    ) {
      return
    }

    const supabase = createClient()
    if (!supabase) return

    const patch = {
      status: bulkStatus,
      is_read: bulkReadState === 'read',
    }

    setIsUpdatingId('bulk')
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('contact_submissions')
        .update(patch)
        .in('id', selectedIds)
      if (updateError) throw updateError

      setSelectedIds([])
      if (preferences.autoRefreshLists) {
        await loadContacts(true)
        return
      }

      setRows(prev =>
        prev.map(row =>
          selectedSet.has(row.id)
            ? { ...row, status: patch.status, is_read: patch.is_read }
            : row
        )
      )
    } catch (updateError) {
      console.error('Failed to apply bulk contact changes:', updateError)
      setError('Не вдалося застосувати масові зміни для звернень.')
    } finally {
      setIsUpdatingId(null)
    }
  }

  const patchContact = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ContactRow, 'status' | 'is_read'>>
    ) => {
      if (!confirmIfNeeded('Підтвердити зміну стану звернення?')) return

      const supabase = createClient()
      if (!supabase) return

      setIsUpdatingId(id)
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('contact_submissions')
          .update(patch)
          .eq('id', id)

        if (updateError) throw updateError

        if (preferences.autoRefreshLists) {
          await loadContacts(true)
          return
        }

        setRows(prev =>
          prev.map(row => (row.id === id ? { ...row, ...patch } : row))
        )
      } catch (updateError) {
        console.error('Failed to update contact:', updateError)
        setError('Не вдалося оновити звернення.')
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadContacts, preferences.autoRefreshLists]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            Звернення клієнтів
          </h1>
          <p className="text-sm text-dental-text-light">
            Черга контактних заявок з SLA-станом та швидкою операційною
            обробкою.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadContacts(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Оновити
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Всього звернень</p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Непрочитані</p>
          <p className="text-2xl font-bold text-amber-600">{stats.unread}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">В роботі</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Вирішені</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
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
            onChange={event => setStatusFilter(event.target.value)}
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Усі статуси</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={readFilter}
            onChange={event => setReadFilter(event.target.value as ReadFilter)}
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Прочитані + непрочитані</option>
            <option value="unread">Тільки непрочитані</option>
            <option value="read">Тільки прочитані</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          Вибрано: {selectedIds.length}
        </span>
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allSelected ? 'Зняти вибір' : 'Вибрати всі'}
        </Button>
        <select
          value={bulkStatus}
          onChange={event => setBulkStatus(event.target.value)}
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>
              Статус: {status}
            </option>
          ))}
        </select>
        <select
          value={bulkReadState}
          onChange={event =>
            setBulkReadState(event.target.value as 'read' | 'unread')
          }
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          <option value="read">Позначити прочитаними</option>
          <option value="unread">Позначити непрочитаними</option>
        </select>
        <Button
          size="sm"
          onClick={() => void applyBulkChanges()}
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

      <div className="space-y-3">
        {isLoading ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white ${emptyStateClass}`}
          >
            Завантаження звернень...
          </div>
        ) : rows.length === 0 ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white ${emptyStateClass}`}
          >
            За поточними фільтрами звернень не знайдено.
          </div>
        ) : (
          rows.map(row => (
            <div
              key={row.id}
              className={`rounded-xl border border-dental-secondary-200 bg-white ${cardPaddingClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(row.id)}
                      onChange={() => toggleSelection(row.id)}
                      aria-label={`Вибрати звернення ${row.name}`}
                    />
                    <p className="font-semibold text-dental-dark">{row.name}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                    {!row.is_read ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-dental-text-light">
                    {row.phone}
                    {row.email ? ` • ${row.email}` : ''} •{' '}
                    {formatDateTime(row.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.status}
                    onChange={event =>
                      void patchContact(row.id, { status: event.target.value })
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
                  <button
                    type="button"
                    onClick={() =>
                      void patchContact(row.id, { is_read: !row.is_read })
                    }
                    disabled={isUpdatingId === row.id}
                    className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                  >
                    {row.is_read
                      ? 'Позначити непрочитаним'
                      : 'Позначити прочитаним'}
                  </button>
                </div>
              </div>

              {row.message ? (
                <details className="mt-3 rounded-lg bg-dental-primary-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-dental-dark">
                    Показати повідомлення
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-dental-text">
                    {row.message}
                  </p>
                </details>
              ) : null}
              {row.admin_notes ? (
                <p className="mt-3 text-xs text-dental-text-light">
                  Адмін-нотатка: {row.admin_notes}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
