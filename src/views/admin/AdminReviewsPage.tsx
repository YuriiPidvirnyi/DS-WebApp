'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, ErrorState, Input, Select } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
import { captureException } from '@/utils/sentry'
import { formatDateTime, getStatusTone } from './utils'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface ReviewRow {
  id: string
  name: string
  rating: number
  service: string
  doctor: string | null
  comment: string
  status: ReviewStatus
  would_recommend: boolean
  is_featured: boolean
  created_at: string
}

export default function AdminReviewsPage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>(
    'pending'
  )
  const [ratingFilter, setRatingFilter] = useState<'all' | '4+' | '5'>('all')
  const [bulkStatus, setBulkStatus] = useState<ReviewStatus>('approved')
  const [bulkFeatured, setBulkFeatured] = useState<
    'keep' | 'feature' | 'unfeature'
  >('keep')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = useCallback(
    async (silent = false) => {
      const supabase = createClient()
      if (!supabase) {
        setError(t('admin.reviewsPage.errors.supabaseUnavailable'))
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
          .from('reviews')
          .select(
            'id, name, rating, service, doctor, comment, status, would_recommend, is_featured, created_at'
          )

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (ratingFilter === '4+') {
          query = query.gte('rating', 4)
        } else if (ratingFilter === '5') {
          query = query.eq('rating', 5)
        }

        const normalizedSearch = searchTerm
          .replace(/[%_',]/g, ' ')
          .trim()
          .slice(0, 100)

        if (normalizedSearch) {
          query = query.or(
            `name.ilike.%${normalizedSearch}%,service.ilike.%${normalizedSearch}%,doctor.ilike.%${normalizedSearch}%,comment.ilike.%${normalizedSearch}%`
          )
        }

        const { data, error: queryError } = await query
          .order('created_at', { ascending: false })
          .limit(300)

        if (queryError) throw queryError

        setRows((data || []) as ReviewRow[])
      } catch (loadError) {
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(t('admin.reviewsPage.errors.loadFailed'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [ratingFilter, searchTerm, statusFilter, t]
  )

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  useEffect(() => {
    const visibleIds = new Set(rows.map(row => row.id))
    setSelectedIds(prev => prev.filter(id => visibleIds.has(id)))
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const pending = rows.filter(row => row.status === 'pending').length
    const approved = rows.filter(row => row.status === 'approved').length
    const featured = rows.filter(row => row.is_featured).length
    return { total, pending, approved, featured }
  }, [rows])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    rows.length > 0 && rows.every(row => selectedSet.has(row.id))
  const cardPaddingClass = preferences.compactTables ? 'p-3' : 'p-4'
  const emptyStateClass = `${
    preferences.compactTables ? 'px-3 py-6' : 'px-4 py-8'
  } text-center text-dental-text-light`
  const getStatusLabel = useCallback(
    (status: ReviewStatus) => t(`admin.reviewStatuses.${status}`),
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
        t('admin.reviewsPage.confirmations.bulkModeration', {
          count: selectedIds.length,
        })
      )
    ) {
      return
    }

    const supabase = createClient()
    if (!supabase) return

    const patch: Partial<Pick<ReviewRow, 'status' | 'is_featured'>> = {
      status: bulkStatus,
    }
    if (bulkFeatured === 'feature') {
      patch.is_featured = true
    } else if (bulkFeatured === 'unfeature') {
      patch.is_featured = false
    }

    setIsUpdatingId('bulk')
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update(patch)
        .in('id', selectedIds)

      if (updateError) throw updateError

      setSelectedIds([])
      if (preferences.autoRefreshLists) {
        await loadReviews(true)
        return
      }

      setRows(prev =>
        prev.map(row => {
          if (!selectedSet.has(row.id)) return row
          return {
            ...row,
            status: bulkStatus,
            is_featured:
              bulkFeatured === 'keep'
                ? row.is_featured
                : bulkFeatured === 'feature',
          }
        })
      )
    } catch (updateError) {
      captureException(
        updateError instanceof Error
          ? updateError
          : new Error(String(updateError))
      )
      setError(t('admin.reviewsPage.errors.bulkUpdateFailed'))
    } finally {
      setIsUpdatingId(null)
    }
  }

  const patchReview = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ReviewRow, 'status' | 'is_featured'>>
    ) => {
      if (!confirmIfNeeded(t('admin.reviewsPage.confirmations.singleUpdate'))) {
        return
      }

      const supabase = createClient()
      if (!supabase) return

      setIsUpdatingId(id)
      setError(null)
      try {
        const { error: updateError } = await supabase
          .from('reviews')
          .update(patch)
          .eq('id', id)

        if (updateError) throw updateError

        if (preferences.autoRefreshLists) {
          await loadReviews(true)
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
        setError(t('admin.reviewsPage.errors.updateFailed'))
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadReviews, preferences.autoRefreshLists, t]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.reviewsPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.reviewsPage.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadReviews(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.reviewsPage.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.reviewsPage.summary.total')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.reviewsPage.summary.pending')}
          </p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.reviewsPage.summary.approved')}
          </p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">
            {t('admin.reviewsPage.summary.featured')}
          </p>
          <p className="text-2xl font-bold text-dental-dark">
            {stats.featured}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('admin.reviewsPage.filters.searchPlaceholder')}
            className="md:col-span-2"
          />
          <Select
            selectSize="compact"
            fullWidth
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value as 'all' | ReviewStatus)
            }
            aria-label={t('admin.reviewsPage.filters.allStatuses')}
          >
            <option value="all">
              {t('admin.reviewsPage.filters.allStatuses')}
            </option>
            <option value="pending">{getStatusLabel('pending')}</option>
            <option value="approved">{getStatusLabel('approved')}</option>
            <option value="rejected">{getStatusLabel('rejected')}</option>
          </Select>
          <Select
            selectSize="compact"
            fullWidth
            value={ratingFilter}
            onChange={event =>
              setRatingFilter(event.target.value as 'all' | '4+' | '5')
            }
            aria-label={t('admin.reviewsPage.filters.allRatings')}
          >
            <option value="all">
              {t('admin.reviewsPage.filters.allRatings')}
            </option>
            <option value="4+">
              {t('admin.reviewsPage.filters.rating4plus')}
            </option>
            <option value="5">{t('admin.reviewsPage.filters.rating5')}</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dental-secondary-200 bg-white px-4 py-3">
        <span className="text-sm text-dental-text-light">
          {t('admin.reviewsPage.bulk.selected', { count: selectedIds.length })}
        </span>
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allSelected
            ? t('admin.reviewsPage.bulk.unselectAll')
            : t('admin.reviewsPage.bulk.selectAll')}
        </Button>
        <Select
          selectSize="compact"
          value={bulkStatus}
          onChange={event => setBulkStatus(event.target.value as ReviewStatus)}
          aria-label={t('admin.reviewsPage.bulk.apply')}
        >
          <option value="approved">
            {t('admin.reviewsPage.bulk.statusOption', {
              status: getStatusLabel('approved'),
            })}
          </option>
          <option value="rejected">
            {t('admin.reviewsPage.bulk.statusOption', {
              status: getStatusLabel('rejected'),
            })}
          </option>
          <option value="pending">
            {t('admin.reviewsPage.bulk.statusOption', {
              status: getStatusLabel('pending'),
            })}
          </option>
        </Select>
        <Select
          selectSize="compact"
          value={bulkFeatured}
          onChange={event =>
            setBulkFeatured(
              event.target.value as 'keep' | 'feature' | 'unfeature'
            )
          }
          aria-label={t('admin.reviewsPage.bulk.feature.keep')}
        >
          <option value="keep">
            {t('admin.reviewsPage.bulk.feature.keep')}
          </option>
          <option value="feature">
            {t('admin.reviewsPage.bulk.feature.enable')}
          </option>
          <option value="unfeature">
            {t('admin.reviewsPage.bulk.feature.disable')}
          </option>
        </Select>
        <Button
          size="sm"
          onClick={() => void applyBulkChanges()}
          disabled={selectedIds.length === 0 || isUpdatingId === 'bulk'}
          isLoading={isUpdatingId === 'bulk'}
        >
          {t('admin.reviewsPage.bulk.apply')}
        </Button>
      </div>

      {error && <ErrorState title={error} onRetry={() => void loadReviews()} />}

      <div className="space-y-3">
        {isLoading ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white ${emptyStateClass}`}
          >
            {t('admin.reviewsPage.loading')}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title={t('admin.reviewsPage.empty')}
          />
        ) : (
          rows.map(row => (
            <div
              key={row.id}
              className={`rounded-xl border border-dental-secondary-200 bg-white ${cardPaddingClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(row.id)}
                      onChange={() => toggleSelection(row.id)}
                      aria-label={t('admin.reviewsPage.card.selectAria', {
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
                    {row.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        <Star className="h-3 w-3 fill-current" />
                        {t('admin.reviewsPage.card.featured')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-dental-text-light">
                    {row.service}
                    {row.doctor ? ` • ${row.doctor}` : ''} •{' '}
                    {formatDateTime(row.created_at)}
                  </p>
                </div>
                <div className="rounded-lg bg-dental-primary-50 px-3 py-1 text-sm font-semibold text-dental-dark">
                  {row.rating}/5
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-dental-text">
                {row.comment}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { status: 'approved' })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
                >
                  {t('admin.reviewsPage.actions.approve')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { status: 'rejected' })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  {t('admin.reviewsPage.actions.reject')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { status: 'pending' })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                >
                  {t('admin.reviewsPage.actions.toPending')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { is_featured: !row.is_featured })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                >
                  {row.is_featured
                    ? t('admin.reviewsPage.actions.unfeature')
                    : t('admin.reviewsPage.actions.feature')}
                </button>
                <span className="text-xs text-dental-text-light">
                  {t('admin.reviewsPage.card.wouldRecommend', {
                    value: row.would_recommend
                      ? t('admin.reviewsPage.card.yes')
                      : t('admin.reviewsPage.card.no'),
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
