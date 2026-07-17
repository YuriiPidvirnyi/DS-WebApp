'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Gift, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, ErrorState, Input, Select } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { redeemWelcomeGift } from '@/services/promo'
import { APIError } from '@/services/api'
import { captureException } from '@/utils/sentry'
import { formatDateTime, getStatusTone } from './utils'

export interface IntakeRow {
  id: string
  patient_id: string | null
  first_name: string
  last_name: string
  patronymic: string | null
  phone: string
  email: string | null
  date_of_birth: string | null
  allergies: string | null
  medications: string | null
  chronic_conditions: string | null
  is_pregnant: boolean | null
  complaints: string | null
  marketing_consent: boolean
  promo_code: string | null
  source: string
  status: string
  admin_notes: string | null
  created_at: string
  promo_redemptions: { id: string; redeemed_at: string }[] | null
}

const STATUS_OPTIONS = ['new', 'reviewed', 'linked']

export default function AdminIntakePage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<IntakeRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadIntakes = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError(t('admin.intakePage.errors.supabaseUnavailable'))
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
          .from('patient_intake_forms')
          .select('*, promo_redemptions(id, redeemed_at)')

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `first_name.ilike.%${normalizedSearch}%,last_name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('created_at', { ascending: false })
          .limit(300)

        if (queryError) throw queryError

        setRows((data || []) as IntakeRow[])
      } catch (loadError) {
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.intakePage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [searchTerm, statusFilter, t]
  )

  useEffect(() => {
    void loadIntakes()
  }, [loadIntakes])

  const stats = useMemo(() => {
    const total = rows.length
    const fresh = rows.filter(row => row.status === 'new').length
    const reviewed = rows.filter(row => row.status === 'reviewed').length
    const withPromo = rows.filter(row => row.promo_code).length
    return { total, fresh, reviewed, withPromo }
  }, [rows])

  const cardPaddingClass = preferences.compactTables ? 'p-3' : 'p-4'
  const getStatusLabel = useCallback(
    (status: string) => t(`admin.intakeStatuses.${status}`),
    [t]
  )

  const redeemGift = useCallback(
    async (row: IntakeRow) => {
      if (!window.confirm(t('admin.intakePage.gift.confirm'))) return

      setIsUpdatingId(row.id)
      setError(null)
      try {
        const res = await redeemWelcomeGift(row.id)
        if (!res.success || !res.data) {
          throw new Error(res.error || t('admin.intakePage.gift.error'))
        }
        const redemption = res.data
        setRows(prev =>
          prev.map(r =>
            r.id === row.id
              ? {
                  ...r,
                  promo_redemptions: [
                    { id: redemption.id, redeemed_at: redemption.redeemed_at },
                  ],
                }
              : r
          )
        )
      } catch (redeemError) {
        if (redeemError instanceof APIError && redeemError.statusCode === 409) {
          setError(t('admin.intakePage.gift.already'))
          await loadIntakes(true)
          return
        }
        captureException(
          redeemError instanceof Error
            ? redeemError
            : new Error(String(redeemError))
        )
        setError(t('admin.intakePage.gift.error'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [loadIntakes, t]
  )

  const patchIntake = useCallback(
    async (
      id: string,
      patch: Partial<Pick<IntakeRow, 'status' | 'admin_notes'>>
    ) => {
      const supabase = createClient()
      if (!supabase) return

      setIsUpdatingId(id)
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from('patient_intake_forms')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (updateError) throw updateError

        setRows(prev =>
          prev.map(row => (row.id === id ? { ...row, ...patch } : row))
        )
      } catch (updateError) {
        captureException(
          updateError instanceof Error
            ? updateError
            : new Error(String(updateError))
        )
        setError(t('admin.intakePage.errors.updateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [t]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.intakePage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.intakePage.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadIntakes(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.intakePage.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile
          label={t('admin.intakePage.summary.total')}
          value={stats.total}
          tone="text-dental-dark"
        />
        <SummaryTile
          label={t('admin.intakePage.summary.new')}
          value={stats.fresh}
          tone="text-amber-600"
        />
        <SummaryTile
          label={t('admin.intakePage.summary.reviewed')}
          value={stats.reviewed}
          tone="text-blue-600"
        />
        <SummaryTile
          label={t('admin.intakePage.summary.withPromo')}
          value={stats.withPromo}
          tone="text-green-600"
        />
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.intakePage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <Select
            selectSize="compact"
            fullWidth
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label={t('admin.intakePage.filters.allStatuses')}
          >
            <option value="all">
              {t('admin.intakePage.filters.allStatuses')}
            </option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <ErrorState title={error} onRetry={() => void loadIntakes()} />}

      <div className="space-y-3">
        {isLoading ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light`}
          >
            {t('admin.intakePage.loading')}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title={t('admin.intakePage.empty')}
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
                    <p className="font-semibold text-dental-dark">
                      {row.last_name} {row.first_name}
                      {row.patronymic ? ` ${row.patronymic}` : ''}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                        row.status
                      )}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                    {row.promo_code ? (
                      <span className="inline-flex rounded-full bg-dental-primary-50 px-2 py-1 text-xs font-medium text-dental-primary-700">
                        {t('admin.intakePage.card.promo', {
                          code: row.promo_code,
                        })}
                      </span>
                    ) : null}
                    {row.patient_id ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {t('admin.intakePage.card.patientLinked')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-dental-text-light">
                    {row.phone}
                    {row.email ? ` • ${row.email}` : ''} •{' '}
                    {formatDateTime(row.created_at)} •{' '}
                    {t('admin.intakePage.card.source', { source: row.source })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {row.promo_redemptions?.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                      <Gift className="h-3.5 w-3.5" />
                      {t('admin.intakePage.gift.given', {
                        date: formatDateTime(
                          row.promo_redemptions[0].redeemed_at
                        ),
                      })}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void redeemGift(row)}
                      disabled={isUpdatingId === row.id}
                    >
                      <Gift className="mr-1.5 h-4 w-4" />
                      {t('admin.intakePage.gift.give')}
                    </Button>
                  )}
                  <Select
                    selectSize="dense"
                    value={row.status}
                    onChange={event =>
                      void patchIntake(row.id, { status: event.target.value })
                    }
                    disabled={isUpdatingId === row.id}
                    aria-label={t('admin.intakePage.card.statusSelectAria', {
                      name: `${row.last_name} ${row.first_name}`,
                    })}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <details className="mt-3 rounded-lg bg-dental-primary-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-dental-dark">
                  {t('admin.intakePage.card.showDetails')}
                </summary>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <DetailField
                    label={t('admin.intakePage.card.dob')}
                    value={row.date_of_birth}
                  />
                  <DetailField
                    label={t('admin.intakePage.card.pregnancy')}
                    value={
                      row.is_pregnant === null
                        ? null
                        : row.is_pregnant
                          ? t('common.yes')
                          : t('common.no')
                    }
                  />
                  <DetailField
                    label={t('admin.intakePage.card.allergies')}
                    value={row.allergies}
                  />
                  <DetailField
                    label={t('admin.intakePage.card.medications')}
                    value={row.medications}
                  />
                  <DetailField
                    label={t('admin.intakePage.card.chronicConditions')}
                    value={row.chronic_conditions}
                  />
                  <DetailField
                    label={t('admin.intakePage.card.complaints')}
                    value={row.complaints}
                  />
                  <DetailField
                    label={t('admin.intakePage.card.marketingConsent')}
                    value={
                      row.marketing_consent ? t('common.yes') : t('common.no')
                    }
                  />
                </dl>
              </details>

              <IntakeNotes
                value={row.admin_notes || ''}
                isSaving={isUpdatingId === row.id}
                placeholder={t('admin.intakePage.card.notesPlaceholder')}
                label={t('admin.intakePage.card.adminNote')}
                onSave={newValue =>
                  void patchIntake(row.id, { admin_notes: newValue || null })
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
      <p className="text-xs text-dental-text-light">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-dental-text-light">{label}</dt>
      <dd className="whitespace-pre-wrap text-dental-text">{value}</dd>
    </div>
  )
}

function IntakeNotes({
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

  useEffect(() => {
    setDraft(value)
  }, [value])

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
          autoFocus
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
