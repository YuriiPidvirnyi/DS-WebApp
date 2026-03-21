'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Star } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { createClient } from '@/lib/supabase/client'
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
        console.error('Failed to load reviews:', loadError)
        setError('Не вдалося завантажити відгуки.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [ratingFilter, searchTerm, statusFilter]
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
        `Застосувати масову модерацію до ${selectedIds.length} відгуків?`
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
      console.error('Failed to apply bulk review changes:', updateError)
      setError('Не вдалося застосувати масові зміни до відгуків.')
    } finally {
      setIsUpdatingId(null)
    }
  }

  const patchReview = useCallback(
    async (
      id: string,
      patch: Partial<Pick<ReviewRow, 'status' | 'is_featured'>>
    ) => {
      if (!confirmIfNeeded('Підтвердити зміну статусу/featured для відгуку?'))
        return

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
        console.error('Failed to update review:', updateError)
        setError('Не вдалося оновити відгук.')
      } finally {
        setIsUpdatingId(null)
      }
    },
    [confirmIfNeeded, loadReviews, preferences.autoRefreshLists]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            Модерація відгуків
          </h1>
          <p className="text-sm text-dental-text-light">
            Швидке погодження/відхилення відгуків та управління featured-блоком.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadReviews(true)}
          isLoading={isRefreshing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Оновити
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Всього</p>
          <p className="text-2xl font-bold text-dental-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
          <p className="text-xs text-dental-text-light">Featured</p>
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
            placeholder="Пошук: автор, послуга, текст"
            className="md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value as 'all' | ReviewStatus)
            }
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Усі статуси</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <select
            value={ratingFilter}
            onChange={event =>
              setRatingFilter(event.target.value as 'all' | '4+' | '5')
            }
            className="rounded-lg border border-dental-secondary px-4 py-3 text-sm"
          >
            <option value="all">Всі рейтинги</option>
            <option value="4+">4 і вище</option>
            <option value="5">Тільки 5</option>
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
          onChange={event => setBulkStatus(event.target.value as ReviewStatus)}
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          <option value="approved">Статус: approved</option>
          <option value="rejected">Статус: rejected</option>
          <option value="pending">Статус: pending</option>
        </select>
        <select
          value={bulkFeatured}
          onChange={event =>
            setBulkFeatured(
              event.target.value as 'keep' | 'feature' | 'unfeature'
            )
          }
          className="rounded-md border border-dental-secondary px-3 py-1.5 text-sm"
        >
          <option value="keep">Featured: без змін</option>
          <option value="feature">Featured: увімкнути</option>
          <option value="unfeature">Featured: вимкнути</option>
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
            Завантаження відгуків...
          </div>
        ) : rows.length === 0 ? (
          <div
            className={`rounded-xl border border-dental-secondary-200 bg-white ${emptyStateClass}`}
          >
            Відгуків не знайдено.
          </div>
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
                      aria-label={`Вибрати відгук від ${row.name}`}
                    />
                    <p className="font-semibold text-dental-dark">{row.name}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusTone(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                    {row.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        <Star className="h-3 w-3 fill-current" />
                        featured
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
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { status: 'rejected' })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { status: 'pending' })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                >
                  To pending
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void patchReview(row.id, { is_featured: !row.is_featured })
                  }
                  disabled={isUpdatingId === row.id}
                  className="rounded-md border border-dental-secondary px-3 py-1.5 text-xs font-semibold text-dental-text hover:bg-dental-secondary-50 disabled:opacity-60"
                >
                  {row.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <span className="text-xs text-dental-text-light">
                  Рекомендує: {row.would_recommend ? 'так' : 'ні'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
