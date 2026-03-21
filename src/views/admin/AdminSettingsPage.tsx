'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import {
  listAdminAuditLogs,
  restoreFromAuditLog,
  type AdminAuditLog,
} from '@/lib/supabase/audit'
import { createClient } from '@/lib/supabase/client'
import AdminModal from './components/AdminModal'
import { formatDateTime, getStatusTone } from './utils'

interface AdminMembership {
  role: 'admin' | 'superadmin'
  display_name: string | null
  created_at: string
  last_login_at: string | null
}

interface ProfileState {
  id: string
  email: string
  lastSignInAt: string | null
  membership: AdminMembership | null
}

const AUDIT_TABLE_OPTIONS = [
  { value: 'all', label: 'Усі таблиці' },
  { value: 'doctors', label: 'doctors' },
  { value: 'services', label: 'services' },
  { value: 'appointments', label: 'appointments' },
  { value: 'reviews', label: 'reviews' },
  { value: 'contact_submissions', label: 'contact_submissions' },
]

const AUDIT_ACTION_OPTIONS = [
  { value: 'all', label: 'Усі дії' },
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
] as const

const AUDIT_PERIOD_OPTIONS = [
  { value: 'all', label: 'За весь час' },
  { value: '24h', label: 'Останні 24 год' },
  { value: '7d', label: 'Останні 7 днів' },
  { value: '30d', label: 'Останні 30 днів' },
] as const

type AuditActionFilter = (typeof AUDIT_ACTION_OPTIONS)[number]['value']
type AuditPeriodFilter = (typeof AUDIT_PERIOD_OPTIONS)[number]['value']
type AuditActorFilter = 'all' | 'mine' | 'unassigned' | `actor:${string}`

export default function AdminSettingsPage() {
  const router = useRouter()
  const { preferences, updatePreferences } = useAdminPreferences()
  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [auditTableFilter, setAuditTableFilter] = useState('all')
  const [auditActionFilter, setAuditActionFilter] =
    useState<AuditActionFilter>('all')
  const [auditPeriodFilter, setAuditPeriodFilter] =
    useState<AuditPeriodFilter>('7d')
  const [auditActorFilter, setAuditActorFilter] =
    useState<AuditActorFilter>('all')
  const [isLoadingAudit, setIsLoadingAudit] = useState(true)
  const [isRestoringAuditId, setIsRestoringAuditId] = useState<string | null>(
    null
  )
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditPreviewLog, setAuditPreviewLog] = useState<AdminAuditLog | null>(
    null
  )
  const [rollbackTarget, setRollbackTarget] = useState<AdminAuditLog | null>(
    null
  )
  const [rollbackReason, setRollbackReason] = useState('')
  const [rollbackComment, setRollbackComment] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setError('Supabase не налаштований. Перевірте змінні середовища.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: membership, error: membershipError } = await supabase
        .from('admin_users')
        .select('role, display_name, created_at, last_login_at')
        .eq('id', user.id)
        .maybeSingle()

      if (membershipError) {
        throw membershipError
      }

      setProfile({
        id: user.id,
        email: user.email || '—',
        lastSignInAt: user.last_sign_in_at || null,
        membership: (membership as AdminMembership | null) || null,
      })
    } catch (loadError) {
      console.error('Failed to load settings profile:', loadError)
      setError('Не вдалося завантажити налаштування.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const periodStartIso = useMemo(() => {
    if (auditPeriodFilter === 'all') return null

    const date = new Date()
    if (auditPeriodFilter === '24h') {
      date.setHours(date.getHours() - 24)
    } else if (auditPeriodFilter === '7d') {
      date.setDate(date.getDate() - 7)
    } else {
      date.setDate(date.getDate() - 30)
    }
    return date.toISOString()
  }, [auditPeriodFilter])

  const actorIds = useMemo(
    () =>
      Array.from(
        new Set(
          auditLogs
            .map(log => log.changed_by)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [auditLogs]
  )

  const loadAuditLogs = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setAuditError('Supabase не налаштований.')
      setIsLoadingAudit(false)
      return
    }

    setIsLoadingAudit(true)
    setAuditError(null)
    try {
      const changedBy =
        auditActorFilter === 'mine'
          ? profile?.id || undefined
          : auditActorFilter.startsWith('actor:')
            ? auditActorFilter.replace('actor:', '')
            : undefined

      const data = await listAdminAuditLogs(supabase, {
        tableName: auditTableFilter,
        action: auditActionFilter,
        changedBy,
        changedByIsNull: auditActorFilter === 'unassigned',
        since: periodStartIso || undefined,
        limit: 80,
      })
      setAuditLogs(data)
    } catch (loadError) {
      console.error('Failed to load audit logs:', loadError)
      setAuditError(
        'Не вдалося завантажити audit logs. Перевірте, чи застосована міграція audit.'
      )
    } finally {
      setIsLoadingAudit(false)
    }
  }, [
    auditActionFilter,
    auditActorFilter,
    auditTableFilter,
    periodStartIso,
    profile?.id,
  ])

  useEffect(() => {
    void loadAuditLogs()
  }, [loadAuditLogs])

  const exportDiagnostics = () => {
    if (typeof window === 'undefined') return

    const diagnostics = {
      generatedAt: new Date().toISOString(),
      profile,
      preferences,
      app: 'Dental Story Admin',
    }
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'admin-diagnostics.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const securityChecks = useMemo(() => {
    return [
      {
        label: 'admin_users membership',
        ok: !!profile?.membership,
        value: profile?.membership ? profile.membership.role : 'missing',
      },
      {
        label: 'Active admin session',
        ok: Boolean(profile?.id),
        value: profile?.id ? 'authenticated' : 'missing',
      },
      {
        label: 'Supabase client',
        ok: !!createClient(),
        value: createClient() ? 'connected' : 'not configured',
      },
    ]
  }, [profile])

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/admin/login')
  }

  const openRollbackModal = (log: AdminAuditLog) => {
    setRollbackTarget(log)
    setRollbackReason('')
    setRollbackComment('')
    setAuditError(null)
  }

  const closeRollbackModal = () => {
    if (isRestoringAuditId) return
    setRollbackTarget(null)
    setRollbackReason('')
    setRollbackComment('')
  }

  const restoreAuditEntry = async () => {
    if (!rollbackTarget) return

    const normalizedReason = rollbackReason.trim()
    if (normalizedReason.length < 5) {
      setAuditError('Вкажіть причину rollback (мінімум 5 символів).')
      return
    }

    const supabase = createClient()
    if (!supabase) return

    if (
      preferences.confirmSensitiveActions &&
      !window.confirm(
        `Підтвердьте rollback ${rollbackTarget.action} у ${rollbackTarget.table_name} (${rollbackTarget.record_id}).`
      )
    ) {
      return
    }

    setIsRestoringAuditId(rollbackTarget.id)
    setAuditError(null)
    setRestoreSuccess(null)

    try {
      const result = await restoreFromAuditLog(supabase, rollbackTarget.id, {
        reason: normalizedReason,
        comment: rollbackComment.trim() || undefined,
      })

      setRestoreSuccess(
        `Rollback виконано: ${result.table} / ${result.record_id} (${result.reverted_action}).`
      )
      closeRollbackModal()
      await loadAuditLogs()
    } catch (restoreError) {
      console.error('Failed to restore from audit:', restoreError)
      setAuditError(
        'Не вдалося виконати restore. Перевірте доступи, reason/comment і актуальність міграцій.'
      )
    } finally {
      setIsRestoringAuditId(null)
    }
  }

  const summarizeAuditLog = (log: AdminAuditLog): string => {
    if (log.action === 'INSERT') {
      const keys = Object.keys(log.after_data || {})
      return `Створено запис (${keys.length} полів)`
    }
    if (log.action === 'DELETE') {
      const keys = Object.keys(log.before_data || {})
      return `Видалено запис (${keys.length} полів)`
    }
    const beforeKeys = Object.keys(log.before_data || {})
    const afterKeys = Object.keys(log.after_data || {})
    const changed = new Set<string>()
    beforeKeys.forEach(key => {
      const beforeValue = (log.before_data || {})[key]
      const afterValue = (log.after_data || {})[key]
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changed.add(key)
      }
    })
    afterKeys.forEach(key => {
      if (!beforeKeys.includes(key)) changed.add(key)
    })
    return `Змінено полів: ${changed.size}`
  }

  const getAuditDiffRows = (log: AdminAuditLog) => {
    const beforeData = (log.before_data || {}) as Record<string, unknown>
    const afterData = (log.after_data || {}) as Record<string, unknown>
    const keys = Array.from(
      new Set([...Object.keys(beforeData), ...Object.keys(afterData)])
    ).sort((a, b) => a.localeCompare(b, 'uk-UA'))

    return keys.map(key => {
      const beforeValue = beforeData[key]
      const afterValue = afterData[key]
      const changed = JSON.stringify(beforeValue) !== JSON.stringify(afterValue)

      return {
        key,
        beforeValue,
        afterValue,
        changed,
      }
    })
  }

  const formatAuditValue = (value: unknown): string => {
    if (typeof value === 'undefined') return '—'
    if (value === null) return 'null'
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
  }

  const auditCellPaddingClass = preferences.compactTables
    ? 'px-2 py-1.5'
    : 'px-3 py-2'
  const rollbackReasonValid = rollbackReason.trim().length >= 5

  const actorFilterOptions = useMemo(() => {
    const dynamicActorOptions = actorIds.map(id => ({
      value: `actor:${id}` as const,
      label: id,
    }))

    return [
      { value: 'all' as const, label: 'Усі актори' },
      { value: 'mine' as const, label: 'Лише мої дії' },
      { value: 'unassigned' as const, label: 'Без автора (system)' },
      ...dynamicActorOptions,
    ]
  }, [actorIds])

  const auditPreviewDiffRows = useMemo(
    () =>
      auditPreviewLog
        ? getAuditDiffRows(auditPreviewLog).filter(row => row.changed)
        : [],
    [auditPreviewLog]
  )

  const rollbackPreviewDiffRows = useMemo(
    () =>
      rollbackTarget
        ? getAuditDiffRows(rollbackTarget).filter(row => row.changed)
        : [],
    [rollbackTarget]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dental-dark">
          Налаштування адмін-панелі
        </h1>
        <p className="text-sm text-dental-text-light">
          Профіль доступу, локальні операційні параметри та технічна
          діагностика.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || !profile ? (
        <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light">
          Завантаження налаштувань...
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                Поточний акаунт
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">Email</dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.email}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">Role</dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.membership?.role || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">Display name</dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.membership?.display_name || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">Last sign in</dt>
                  <dd className="font-medium text-dental-dark">
                    {formatDateTime(profile.lastSignInAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">Membership created</dt>
                  <dd className="font-medium text-dental-dark">
                    {formatDateTime(profile.membership?.created_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                Security checks
              </h2>
              <ul className="mt-3 space-y-2">
                {securityChecks.map(check => (
                  <li
                    key={check.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-dental-text">
                      {check.label}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                        check.ok ? 'active' : 'inactive'
                      )}`}
                    >
                      {check.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-dental-dark">
              Операційні параметри
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span className="text-dental-text">
                  Автооновлення списків після дій
                </span>
                <input
                  type="checkbox"
                  checked={preferences.autoRefreshLists}
                  onChange={event =>
                    updatePreferences({
                      autoRefreshLists: event.target.checked,
                    })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-dental-text">
                  Компактний режим таблиць
                </span>
                <input
                  type="checkbox"
                  checked={preferences.compactTables}
                  onChange={event =>
                    updatePreferences({ compactTables: event.target.checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-dental-text">
                  Підтвердження чутливих дій
                </span>
                <input
                  type="checkbox"
                  checked={preferences.confirmSensitiveActions}
                  onChange={event =>
                    updatePreferences({
                      confirmSensitiveActions: event.target.checked,
                    })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-dental-text">
                  Період аналітики за замовчуванням
                </span>
                <select
                  value={preferences.defaultAnalyticsPeriod}
                  onChange={event =>
                    updatePreferences({
                      defaultAnalyticsPeriod: Number(event.target.value) as
                        | 7
                        | 30
                        | 90,
                    })
                  }
                  className="rounded-lg border border-dental-secondary px-3 py-1.5"
                >
                  <option value={7}>7 днів</option>
                  <option value={30}>30 днів</option>
                  <option value={90}>90 днів</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-dental-dark">
                Audit logs і rollback
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={auditTableFilter}
                  onChange={event => setAuditTableFilter(event.target.value)}
                  className="rounded-lg border border-dental-secondary px-3 py-1.5 text-sm"
                >
                  {AUDIT_TABLE_OPTIONS.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={auditActionFilter}
                  onChange={event =>
                    setAuditActionFilter(
                      event.target.value as AuditActionFilter
                    )
                  }
                  className="rounded-lg border border-dental-secondary px-3 py-1.5 text-sm"
                >
                  {AUDIT_ACTION_OPTIONS.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={auditPeriodFilter}
                  onChange={event =>
                    setAuditPeriodFilter(
                      event.target.value as AuditPeriodFilter
                    )
                  }
                  className="rounded-lg border border-dental-secondary px-3 py-1.5 text-sm"
                >
                  {AUDIT_PERIOD_OPTIONS.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={auditActorFilter}
                  onChange={event =>
                    setAuditActorFilter(event.target.value as AuditActorFilter)
                  }
                  className="max-w-[260px] rounded-lg border border-dental-secondary px-3 py-1.5 text-sm"
                >
                  {actorFilterOptions.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadAuditLogs()}
                >
                  Оновити логи
                </Button>
              </div>
            </div>

            {auditError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {auditError}
              </div>
            ) : null}
            {restoreSuccess ? (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {restoreSuccess}
              </div>
            ) : null}

            {isLoadingAudit ? (
              <div className="mt-4 text-sm text-dental-text-light">
                Завантаження audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="mt-4 text-sm text-dental-text-light">
                Логів не знайдено.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Коли
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Таблиця
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Дія
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        changed_by
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Запис
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Зміст
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td
                          className={`${auditCellPaddingClass} text-xs text-dental-text-light`}
                        >
                          {formatDateTime(log.changed_at)}
                        </td>
                        <td
                          className={`${auditCellPaddingClass} text-dental-text`}
                        >
                          {log.table_name}
                        </td>
                        <td className={auditCellPaddingClass}>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                              log.action === 'INSERT'
                                ? 'active'
                                : log.action === 'UPDATE'
                                  ? 'in_progress'
                                  : 'inactive'
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td
                          className={`${auditCellPaddingClass} text-xs text-dental-text-light`}
                        >
                          {log.changed_by || 'system'}
                        </td>
                        <td
                          className={`${auditCellPaddingClass} text-xs text-dental-text-light`}
                        >
                          {log.record_id}
                        </td>
                        <td
                          className={`${auditCellPaddingClass} text-dental-text`}
                        >
                          {summarizeAuditLog(log)}
                        </td>
                        <td className={auditCellPaddingClass}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAuditPreviewLog(log)}
                            >
                              Diff
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openRollbackModal(log)}
                              isLoading={isRestoringAuditId === log.id}
                            >
                              Rollback
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportDiagnostics}>
              Експортувати діагностику
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadProfile()}
            >
              Оновити профіль
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Вийти з адмінки
            </Button>
          </div>

          <AdminModal
            open={Boolean(auditPreviewLog)}
            title="Diff змін audit log"
            subtitle="Порівняння before_data та after_data для вибраного запису."
            onClose={() => setAuditPreviewLog(null)}
            maxWidthClassName="max-w-5xl"
          >
            {auditPreviewLog ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-dental-primary-50 p-3 text-sm text-dental-text">
                  <p>
                    <span className="font-semibold text-dental-dark">
                      Таблиця:
                    </span>{' '}
                    {auditPreviewLog.table_name}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">
                      Запис:
                    </span>{' '}
                    {auditPreviewLog.record_id}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">Дія:</span>{' '}
                    {auditPreviewLog.action}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">
                      Коли:
                    </span>{' '}
                    {formatDateTime(auditPreviewLog.changed_at)}
                  </p>
                </div>

                {auditPreviewDiffRows.length === 0 ? (
                  <div className="rounded-lg border border-dental-secondary-200 bg-white p-3 text-sm text-dental-text-light">
                    Відмінностей не виявлено.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditPreviewDiffRows.map(row => (
                      <div
                        key={row.key}
                        className="rounded-lg border border-dental-secondary-200 bg-white p-3"
                      >
                        <p className="mb-2 text-xs font-semibold uppercase text-dental-text-light">
                          {row.key}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs font-semibold text-dental-text-light">
                              BEFORE
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-red-50 p-2 text-xs text-red-800">
                              {formatAuditValue(row.beforeValue)}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-dental-text-light">
                              AFTER
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-green-50 p-2 text-xs text-green-800">
                              {formatAuditValue(row.afterValue)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </AdminModal>

          <AdminModal
            open={Boolean(rollbackTarget)}
            title="Підтвердження rollback"
            subtitle="Safe-guard: перевірте diff, вкажіть причину і лише потім підтверджуйте відкат."
            onClose={closeRollbackModal}
            maxWidthClassName="max-w-4xl"
          >
            {rollbackTarget ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>
                    Відкат буде застосований до{' '}
                    <strong>{rollbackTarget.table_name}</strong> /{' '}
                    <strong>{rollbackTarget.record_id}</strong> для дії{' '}
                    <strong>{rollbackTarget.action}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {summarizeAuditLog(rollbackTarget)}
                  </p>
                </div>

                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {rollbackPreviewDiffRows.length === 0 ? (
                    <div className="rounded-lg border border-dental-secondary-200 bg-white p-3 text-sm text-dental-text-light">
                      Немає змінених полів для preview.
                    </div>
                  ) : (
                    rollbackPreviewDiffRows.map(row => (
                      <div
                        key={row.key}
                        className="rounded-lg border border-dental-secondary-200 bg-white p-2"
                      >
                        <p className="text-xs font-semibold text-dental-dark">
                          {row.key}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          <pre className="overflow-x-auto rounded-md bg-red-50 p-2 text-xs text-red-800">
                            {formatAuditValue(row.beforeValue)}
                          </pre>
                          <pre className="overflow-x-auto rounded-md bg-green-50 p-2 text-xs text-green-800">
                            {formatAuditValue(row.afterValue)}
                          </pre>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Textarea
                  label="Причина rollback (обов'язково, мінімум 5 символів)"
                  value={rollbackReason}
                  onChange={event => setRollbackReason(event.target.value)}
                  rows={3}
                  required
                />
                <Textarea
                  label="Коментар (опційно)"
                  value={rollbackComment}
                  onChange={event => setRollbackComment(event.target.value)}
                  rows={2}
                />

                <div className="flex items-center justify-end gap-2 border-t border-dental-secondary-200 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeRollbackModal}
                    disabled={Boolean(isRestoringAuditId)}
                  >
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => void restoreAuditEntry()}
                    disabled={
                      !rollbackReasonValid ||
                      Boolean(
                        rollbackTarget &&
                        isRestoringAuditId === rollbackTarget.id
                      )
                    }
                    isLoading={Boolean(
                      rollbackTarget && isRestoringAuditId === rollbackTarget.id
                    )}
                  >
                    Підтвердити rollback
                  </Button>
                </div>
              </div>
            ) : null}
          </AdminModal>
        </>
      )}
    </div>
  )
}
