'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, ErrorState, Input, Select } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
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
  const { t } = useTranslation()
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
        setError(t('admin.contactsPage.errors.supabaseUnavailable'))
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
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.contactsPage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [readFilter, searchTerm, statusFilter, t]
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
  const getStatusLabel = useCallback(
    (status: string) => t(`admin.contactStatuses.${status}`),
    [t]
  )

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
        t('admin.contactsPage.confirmations.bulkChange', {
          count: selectedIds.length,
        })
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
      captureException(
        updateError instanceof Error
          ? updateError
          : new Error(String(updateError))
      )
      setError(t('admin.contactsPage.errors.bulkUpdateFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const patchContact = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ContactRow, 'status' | 'is_read' | 'admin_notes'>>
    ) => {
      if (
        !confirmIfNeeded(t('admin.contactsPage.confirmations.singleUpdate'))
      ) {
        return
      }

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
        captureException(
          updateError instanceof Error
            ? updateError
            : new Error(String(updateError))
        )
        setError(t('admin.contactsPage.errors.updateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadContacts, preferences.autoRefreshLists, t]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.contactsPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.contactsPage.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadContacts(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.contactsPage.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.contactsPage.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.contactsPage.summary.unread')}
          </p>
          <p className="text-2xl font-bold text-amber-600">{stats.unread}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.contactsPage.summary.inProgress')}
          </p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.contactsPage.summary.resolved')}
          </p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.contactsPage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <Select
            selectSize="compact"
            fullWidth
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label={t('admin.contactsPage.filters.allStatuses')}
          >
            <option value="all">
              {t('admin.contactsPage.filters.allStatuses')}
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
            value={readFilter}
            onChange={event => setReadFilter(event.target.value as ReadFilter)}
            aria-label={t('admin.contactsPage.filters.read.all')}
          >
            <option value="all">
              {t('admin.contactsPage.filters.read.all')}
            </option>
            <option value="unread">
              {t('admin.contactsPage.filters.read.unread')}
            </option>
            <option value="read">
              {t('admin.contactsPage.filters.read.read')}
            </option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          {t('admin.contactsPage.bulk.selected', { count: selectedIds.length })}
        </span>
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allSelected
            ? t('admin.contactsPage.bulk.unselectAll')
            : t('admin.contactsPage.bulk.selectAll')}
        </Button>
        <Select
          selectSize="compact"
          value={bulkStatus}
          onChange={event => setBulkStatus(event.target.value)}
          aria-label={t('admin.contactsPage.bulk.apply')}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>
              {t('admin.contactsPage.bulk.statusOption', {
                status: getStatusLabel(status),
              })}
            </option>
          ))}
        </Select>
        <Select
          selectSize="compact"
          value={bulkReadState}
          onChange={event =>
            setBulkReadState(event.target.value as 'read' | 'unread')
          }
          aria-label={t('admin.contactsPage.bulk.markRead')}
        >
          <option value="read">{t('admin.contactsPage.bulk.markRead')}</option>
          <option value="unread">
            {t('admin.contactsPage.bulk.markUnread')}
          </option>
        </Select>
        <Button
          size="sm"
          onClick={() => void applyBulkChanges()}
          disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
          isLoading={isUpdatingId === 'bulk'}
        >
          {t('admin.contactsPage.bulk.apply')}
        </Button>
      </div>

      {error && (
        <ErrorState title={error} onRetry={() => void loadContacts()} />
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white ${emptyStateClass}`}
          >
            {t('admin.contactsPage.loading')}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<StickyNote className="h-8 w-8" />}
            title={t('admin.contactsPage.empty')}
          />
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
                      aria-label={t('admin.contactsPage.card.selectAria', {
                        name: row.name,
                      })}
                    />
                    <p className="font-semibold text-dental-dark">{row.name}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                        row.status
                      )}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                    {!row.is_read ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        {t('admin.contactsPage.card.unreadBadge')}
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
                  <Select
                    selectSize="dense"
                    value={row.status}
                    onChange={event =>
                      void patchContact(row.id, { status: event.target.value })
                    }
                    disabled={isUpdatingId === row.id}
                    aria-label={t('admin.contactsPage.card.statusSelectAria', {
                      name: row.name,
                    })}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() =>
                      void patchContact(row.id, { is_read: !row.is_read })
                    }
                    disabled={isUpdatingId === row.id}
                    className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                  >
                    {row.is_read
                      ? t('admin.contactsPage.card.markUnread')
                      : t('admin.contactsPage.card.markRead')}
                  </button>
                </div>
              </div>

              {row.message ? (
                <details className="mt-3 rounded-lg bg-dental-primary-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-dental-dark">
                    {t('admin.contactsPage.card.showMessage')}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-dental-text">
                    {row.message}
                  </p>
                </details>
              ) : null}
              <InlineNotes
                value={row.admin_notes || ''}
                isSaving={isUpdatingId === row.id}
                placeholder={t('admin.contactsPage.card.notesPlaceholder')}
                label={t('admin.contactsPage.card.adminNote')}
                onSave={newValue =>
                  void patchContact(row.id, {
                    admin_notes: newValue || null,
                  })
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function InlineNotes({
  value,
  isSaving,
  placeholder,
  label,
  onSave,
}: {
  value: string
  isSaving: boolean
  placeholder: string
  label: string
  onSave: (newValue: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const save = () => {
    setIsEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) {
      onSave(trimmed)
    }
  }

  if (isEditing) {
    return (
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-dental-text-light">
          {label}
        </label>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setDraft(value)
              setIsEditing(false)
            }
          }}
          placeholder={placeholder}
          disabled={isSaving}
          rows={2}
          className="w-full rounded-lg border border-dental-secondary bg-white px-3 py-2 text-sm text-dental-text focus:border-dental-primary-600 focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600 disabled:opacity-60"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="mt-3 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-xs text-dental-text-light transition-colors hover:bg-dental-secondary-50"
    >
      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {value ? (
        <span>
          <span className="font-medium">{label}:</span> {value}
        </span>
      ) : (
        <span className="italic">{placeholder}</span>
      )}
    </button>
  )
}
