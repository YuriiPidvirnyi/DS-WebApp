'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
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
  'all',
  'doctors',
  'services',
  'appointments',
  'reviews',
  'contact_submissions',
] as const

const AUDIT_ACTION_OPTIONS = ['all', 'INSERT', 'UPDATE', 'DELETE'] as const

const AUDIT_PERIOD_OPTIONS = ['all', '24h', '7d', '30d'] as const

type AuditTableFilter = (typeof AUDIT_TABLE_OPTIONS)[number]
type AuditActionFilter = (typeof AUDIT_ACTION_OPTIONS)[number]
type AuditPeriodFilter = (typeof AUDIT_PERIOD_OPTIONS)[number]
type AuditActorFilter = 'all' | 'mine' | 'unassigned' | `actor:${string}`

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { preferences, updatePreferences } = useAdminPreferences()
  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [auditTableFilter, setAuditTableFilter] =
    useState<AuditTableFilter>('all')
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

  const getMembershipRoleLabel = useCallback(
    (role: AdminMembership['role']) =>
      t(`admin.settingsPage.profile.roles.${role}`),
    [t]
  )

  const getAuditActionLabel = useCallback(
    (action: string) => {
      if (action === 'all')
        return t('admin.settingsPage.audit.actionOptions.all')
      if (action === 'INSERT') {
        return t('admin.settingsPage.audit.actionOptions.INSERT')
      }
      if (action === 'UPDATE') {
        return t('admin.settingsPage.audit.actionOptions.UPDATE')
      }
      if (action === 'DELETE') {
        return t('admin.settingsPage.audit.actionOptions.DELETE')
      }
      return action
    },
    [t]
  )

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setError(t('admin.settingsPage.errors.supabaseUnavailable'))
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
      setError(t('admin.settingsPage.errors.loadSettingsFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [router, t])

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
      setAuditError(t('admin.settingsPage.audit.errors.supabaseUnavailable'))
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
      setAuditError(t('admin.settingsPage.audit.errors.loadFailed'))
    } finally {
      setIsLoadingAudit(false)
    }
  }, [
    auditActionFilter,
    auditActorFilter,
    auditTableFilter,
    periodStartIso,
    profile?.id,
    t,
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
      app: t('admin.settingsPage.diagnostics.appName'),
    }
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = t('admin.settingsPage.diagnostics.fileName')
    link.click()
    URL.revokeObjectURL(url)
  }

  const securityChecks = useMemo(() => {
    return [
      {
        label: t('admin.settingsPage.security.membershipLabel'),
        ok: !!profile?.membership,
        value: profile?.membership
          ? getMembershipRoleLabel(profile.membership.role)
          : t('admin.settingsPage.security.missingValue'),
      },
      {
        label: t('admin.settingsPage.security.sessionLabel'),
        ok: Boolean(profile?.id),
        value: profile?.id
          ? t('admin.settingsPage.security.authenticatedValue')
          : t('admin.settingsPage.security.missingValue'),
      },
      {
        label: t('admin.settingsPage.security.supabaseLabel'),
        ok: !!createClient(),
        value: createClient()
          ? t('admin.settingsPage.security.connectedValue')
          : t('admin.settingsPage.security.notConfiguredValue'),
      },
    ]
  }, [getMembershipRoleLabel, profile, t])

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
      setAuditError(t('admin.settingsPage.rollback.errors.reasonTooShort'))
      return
    }

    const supabase = createClient()
    if (!supabase) return

    if (
      preferences.confirmSensitiveActions &&
      !window.confirm(
        t('admin.settingsPage.rollback.confirmPrompt', {
          action: getAuditActionLabel(rollbackTarget.action),
          table: rollbackTarget.table_name,
          recordId: rollbackTarget.record_id,
        })
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
        t('admin.settingsPage.rollback.success', {
          table: result.table,
          recordId: result.record_id,
          action: getAuditActionLabel(result.reverted_action),
        })
      )
      closeRollbackModal()
      await loadAuditLogs()
    } catch (restoreError) {
      console.error('Failed to restore from audit:', restoreError)
      setAuditError(t('admin.settingsPage.rollback.errors.restoreFailed'))
    } finally {
      setIsRestoringAuditId(null)
    }
  }

  const summarizeAuditLog = (log: AdminAuditLog): string => {
    if (log.action === 'INSERT') {
      const keys = Object.keys(log.after_data || {})
      return t('admin.settingsPage.audit.summary.created', {
        count: keys.length,
      })
    }
    if (log.action === 'DELETE') {
      const keys = Object.keys(log.before_data || {})
      return t('admin.settingsPage.audit.summary.deleted', {
        count: keys.length,
      })
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
    return t('admin.settingsPage.audit.summary.changed', {
      count: changed.size,
    })
  }

  const getAuditDiffRows = (log: AdminAuditLog) => {
    const beforeData = (log.before_data || {}) as Record<string, unknown>
    const afterData = (log.after_data || {}) as Record<string, unknown>
    const keys = Array.from(
      new Set([...Object.keys(beforeData), ...Object.keys(afterData)])
    ).sort((a, b) => a.localeCompare(b))

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
    if (value === null) return t('admin.settingsPage.audit.nullValue')
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
      {
        value: 'all' as const,
        label: t('admin.settingsPage.audit.actorOptions.all'),
      },
      {
        value: 'mine' as const,
        label: t('admin.settingsPage.audit.actorOptions.mine'),
      },
      {
        value: 'unassigned' as const,
        label: t('admin.settingsPage.audit.actorOptions.unassigned'),
      },
      ...dynamicActorOptions,
    ]
  }, [actorIds, t])

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
          {t('admin.settingsPage.title')}
        </h1>
        <p className="text-sm text-dental-text-light">
          {t('admin.settingsPage.description')}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || !profile ? (
        <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light">
          {t('admin.settingsPage.loading')}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                {t('admin.settingsPage.profile.title')}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">
                    {t('admin.settingsPage.profile.email')}
                  </dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.email}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">
                    {t('admin.settingsPage.profile.role')}
                  </dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.membership?.role
                      ? getMembershipRoleLabel(profile.membership.role)
                      : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">
                    {t('admin.settingsPage.profile.displayName')}
                  </dt>
                  <dd className="font-medium text-dental-dark">
                    {profile.membership?.display_name || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">
                    {t('admin.settingsPage.profile.lastSignIn')}
                  </dt>
                  <dd className="font-medium text-dental-dark">
                    {formatDateTime(profile.lastSignInAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-dental-text-light">
                    {t('admin.settingsPage.profile.membershipCreated')}
                  </dt>
                  <dd className="font-medium text-dental-dark">
                    {formatDateTime(profile.membership?.created_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                {t('admin.settingsPage.security.title')}
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
              {t('admin.settingsPage.preferences.title')}
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span className="text-dental-text">
                  {t('admin.settingsPage.preferences.autoRefresh')}
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
                  {t('admin.settingsPage.preferences.compactTables')}
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
                  {t('admin.settingsPage.preferences.confirmSensitive')}
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
                  {t('admin.settingsPage.preferences.defaultAnalyticsPeriod')}
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
                  <option value={7}>
                    {t('admin.settingsPage.preferences.periodOptions.7')}
                  </option>
                  <option value={30}>
                    {t('admin.settingsPage.preferences.periodOptions.30')}
                  </option>
                  <option value={90}>
                    {t('admin.settingsPage.preferences.periodOptions.90')}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-dental-dark">
                {t('admin.settingsPage.audit.title')}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={auditTableFilter}
                  onChange={event =>
                    setAuditTableFilter(event.target.value as AuditTableFilter)
                  }
                  className="rounded-lg border border-dental-secondary px-3 py-1.5 text-sm"
                >
                  {AUDIT_TABLE_OPTIONS.map(value => (
                    <option key={value} value={value}>
                      {t(`admin.settingsPage.audit.tableOptions.${value}`)}
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
                  {AUDIT_ACTION_OPTIONS.map(value => (
                    <option key={value} value={value}>
                      {getAuditActionLabel(value)}
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
                  {AUDIT_PERIOD_OPTIONS.map(value => (
                    <option key={value} value={value}>
                      {t(`admin.settingsPage.audit.periodOptions.${value}`)}
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
                  {t('admin.settingsPage.audit.refreshLogs')}
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
                {t('admin.settingsPage.audit.loading')}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="mt-4 text-sm text-dental-text-light">
                {t('admin.settingsPage.audit.empty')}
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.when')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.table')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.action')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.changedBy')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.record')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.summary')}
                      </th>
                      <th
                        className={`${auditCellPaddingClass} text-left text-xs font-semibold uppercase text-gray-500`}
                      >
                        {t('admin.settingsPage.audit.tableHeaders.actions')}
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
                            {getAuditActionLabel(log.action)}
                          </span>
                        </td>
                        <td
                          className={`${auditCellPaddingClass} text-xs text-dental-text-light`}
                        >
                          {log.changed_by ||
                            t('admin.settingsPage.audit.systemActor')}
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
                              {t('admin.settingsPage.audit.actions.diff')}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openRollbackModal(log)}
                              isLoading={isRestoringAuditId === log.id}
                            >
                              {t('admin.settingsPage.audit.actions.rollback')}
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
              {t('admin.settingsPage.actions.exportDiagnostics')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadProfile()}
            >
              {t('admin.settingsPage.actions.refreshProfile')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              {t('admin.settingsPage.actions.logout')}
            </Button>
          </div>

          <AdminModal
            open={Boolean(auditPreviewLog)}
            title={t('admin.settingsPage.audit.diffModal.title')}
            subtitle={t('admin.settingsPage.audit.diffModal.subtitle')}
            onClose={() => setAuditPreviewLog(null)}
            maxWidthClassName="max-w-5xl"
          >
            {auditPreviewLog ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-dental-primary-50 p-3 text-sm text-dental-text">
                  <p>
                    <span className="font-semibold text-dental-dark">
                      {t('admin.settingsPage.audit.diffModal.meta.table')}:
                    </span>{' '}
                    {auditPreviewLog.table_name}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">
                      {t('admin.settingsPage.audit.diffModal.meta.record')}:
                    </span>{' '}
                    {auditPreviewLog.record_id}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">
                      {t('admin.settingsPage.audit.diffModal.meta.action')}:
                    </span>{' '}
                    {getAuditActionLabel(auditPreviewLog.action)}
                  </p>
                  <p>
                    <span className="font-semibold text-dental-dark">
                      {t('admin.settingsPage.audit.diffModal.meta.when')}:
                    </span>{' '}
                    {formatDateTime(auditPreviewLog.changed_at)}
                  </p>
                </div>

                {auditPreviewDiffRows.length === 0 ? (
                  <div className="rounded-lg border border-dental-secondary-200 bg-white p-3 text-sm text-dental-text-light">
                    {t('admin.settingsPage.audit.diffModal.noChanges')}
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
                              {t('admin.settingsPage.audit.diffModal.before')}
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-red-50 p-2 text-xs text-red-800">
                              {formatAuditValue(row.beforeValue)}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-dental-text-light">
                              {t('admin.settingsPage.audit.diffModal.after')}
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
            title={t('admin.settingsPage.rollback.modal.title')}
            subtitle={t('admin.settingsPage.rollback.modal.subtitle')}
            onClose={closeRollbackModal}
            maxWidthClassName="max-w-4xl"
          >
            {rollbackTarget ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>
                    {t('admin.settingsPage.rollback.modal.targetPrefix')}{' '}
                    <strong>{rollbackTarget.table_name}</strong> /{' '}
                    <strong>{rollbackTarget.record_id}</strong>{' '}
                    {t('admin.settingsPage.rollback.modal.targetInfix')}{' '}
                    <strong>
                      {getAuditActionLabel(rollbackTarget.action)}
                    </strong>
                    .
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {summarizeAuditLog(rollbackTarget)}
                  </p>
                </div>

                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {rollbackPreviewDiffRows.length === 0 ? (
                    <div className="rounded-lg border border-dental-secondary-200 bg-white p-3 text-sm text-dental-text-light">
                      {t('admin.settingsPage.rollback.modal.noPreviewChanges')}
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
                  label={t('admin.settingsPage.rollback.modal.reasonLabel')}
                  value={rollbackReason}
                  onChange={event => setRollbackReason(event.target.value)}
                  rows={3}
                  required
                />
                <Textarea
                  label={t('admin.settingsPage.rollback.modal.commentLabel')}
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
                    {t('admin.settingsPage.rollback.modal.cancel')}
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
                    {t('admin.settingsPage.rollback.modal.confirm')}
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
