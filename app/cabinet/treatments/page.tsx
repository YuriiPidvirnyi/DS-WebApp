'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { FileText, Calendar, Activity, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  trackEvent,
  CabinetEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'
import * as Sentry from '@sentry/nextjs'

type TreatmentRecord = {
  id: string
  diagnosis: string | null
  notes: string | null
  tooth_numbers: string[]
  status: string
  total_cost: number
  payment_status: string
  created_at: string
  doctors:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null
  treatment_record_items:
    | {
        service_id: string
        tooth_number: string | null
        quantity: number
        price_at_time: number
        services: { name_uk: string } | null
      }[]
    | null
}

const TREATMENTS_PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-dental-secondary-200 text-dental-dark',
  signed: 'bg-dental-primary-100 text-dental-primary-600',
  completed: 'bg-green-100 text-green-700',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-amber-100 text-amber-700',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  waived: 'bg-dental-secondary-100 text-dental-muted',
  refunded: 'bg-violet-100 text-violet-700',
}

function doctorName(d: TreatmentRecord['doctors']): string {
  const r = Array.isArray(d) ? d[0] : d
  return r ? `${r.last_name} ${r.first_name}`.trim() : '—'
}

function TreatmentsSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-busy="true">
      <div className="h-7 w-48 bg-dental-secondary-200 rounded-lg" />
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-dental-secondary-100 space-y-3"
        >
          <div className="flex justify-between">
            <div className="h-5 w-44 bg-dental-secondary-200 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-dental-secondary-100 rounded-full" />
              <div className="h-5 w-20 bg-dental-secondary-100 rounded-full" />
            </div>
          </div>
          <div className="h-4 w-56 bg-dental-secondary-100 rounded" />
          <div className="h-4 w-40 bg-dental-secondary-100 rounded" />
          <div className="pt-3 border-t border-dental-secondary-100">
            <div className="h-5 w-24 bg-dental-secondary-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TreatmentsHistoryPage() {
  const { t, i18n } = useTranslation()
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const locale = i18n.language || 'uk'
  const dateLocale =
    locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-US'

  const [fetchError, setFetchError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)

  const fetchRecordsPage = useCallback(async (offset: number) => {
    const supabase = createClient()
    if (!supabase) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('treatment_records')
      .select(
        `id, diagnosis, notes, tooth_numbers, status, total_cost, payment_status, created_at,
        doctors(first_name, last_name),
        treatment_record_items(service_id, tooth_number, quantity, price_at_time, services(name_uk))`
      )
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + TREATMENTS_PAGE_SIZE - 1)

    if (error) throw error
    return (data as TreatmentRecord[]) || []
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchRecordsPage(0)
        if (cancelled || data === null) return
        setRecords(data)
        setHasMore(data.length === TREATMENTS_PAGE_SIZE)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error('Treatment records fetch error:', err)
        setFetchError(true)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [fetchRecordsPage])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const data = await fetchRecordsPage(records.length)
      if (data) {
        setRecords(prev => [...prev, ...data])
        setHasMore(data.length === TREATMENTS_PAGE_SIZE)
      }
    } catch (err) {
      console.error('Treatment records fetch error:', err)
      setLoadMoreError(true)
    }
    setLoadingMore(false)
  }

  if (loading) return <TreatmentsSkeleton />

  if (fetchError) {
    return (
      <ErrorState
        title={t('cabinet.error.title')}
        description={t('cabinet.error.description')}
        onRetry={() => window.location.reload()}
        retryLabel={t('cabinet.error.retry')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dental-dark">
        {t('cabinet.treatments.title')}
      </h1>

      {records.length === 0 ? (
        <EmptyState
          icon={
            <div className="w-16 h-16 bg-dental-primary-50 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-dental-primary-600" />
            </div>
          }
          title={t('cabinet.treatments.empty')}
        />
      ) : (
        <ul className="space-y-3" role="list">
          {records.map(rec => {
            const isExpanded = expandedId === rec.id
            const detailsId = `treatment-details-${rec.id}`

            return (
              <li
                key={rec.id}
                className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 overflow-hidden transition-colors hover:border-dental-primary-200"
              >
                {/* Clickable header */}
                <button
                  type="button"
                  onClick={() => {
                    const opening = !isExpanded
                    setExpandedId(opening ? rec.id : null)
                    if (opening) {
                      trackEvent(
                        CabinetEvent.TreatmentViewed,
                        AnalyticsEventCategory.Cabinet,
                        { treatment_id: rec.id, status: rec.status }
                      )
                      Sentry.addBreadcrumb({
                        category: 'cabinet',
                        message: 'treatment_viewed',
                        level: 'info',
                        data: { treatment_id: rec.id, status: rec.status },
                      })
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  className="w-full text-left p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dental-primary-500"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-dental-dark">
                      <Calendar className="w-4 h-4 text-dental-primary-600 shrink-0" />
                      <span className="font-semibold text-sm">
                        {new Date(rec.created_at).toLocaleDateString(
                          dateLocale,
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[rec.status] || 'bg-dental-secondary-100 text-dental-muted'}`}
                      >
                        {t(`cabinet.treatments.status.${rec.status}`, {
                          defaultValue: rec.status,
                        })}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${PAYMENT_STYLES[rec.payment_status] || 'bg-dental-secondary-100 text-dental-muted'}`}
                      >
                        {t(`cabinet.treatments.payment.${rec.payment_status}`, {
                          defaultValue: rec.payment_status,
                        })}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-dental-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-dental-muted">
                    <span className="font-medium text-dental-dark">
                      {t('cabinet.treatments.doctor')}:
                    </span>{' '}
                    {doctorName(rec.doctors)}
                  </p>

                  <p className="mt-2 text-dental-dark font-semibold text-sm">
                    {Number(rec.total_cost).toLocaleString(dateLocale)}{' '}
                    {t('cabinet.currency')}
                  </p>
                </button>

                {/* Expandable detail */}
                <div
                  id={detailsId}
                  role="region"
                  aria-labelledby={`treatment-header-${rec.id}`}
                  hidden={!isExpanded}
                >
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 space-y-3 border-t border-dental-secondary-100">
                      {rec.diagnosis && (
                        <p className="text-sm text-dental-dark pt-3">
                          <span className="font-medium">
                            {t('cabinet.treatments.diagnosis')}:
                          </span>{' '}
                          {rec.diagnosis}
                        </p>
                      )}

                      {rec.treatment_record_items &&
                        rec.treatment_record_items.length > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center gap-2 text-dental-primary-600 text-sm font-medium mb-2">
                              <Activity className="w-4 h-4" />
                              {t('cabinet.treatments.procedures')}
                            </div>
                            <div className="bg-dental-secondary-50 rounded-xl p-3">
                              <ul className="text-sm text-dental-text space-y-1.5">
                                {rec.treatment_record_items.map((it, i) => (
                                  <li
                                    key={`${rec.id}-${i}`}
                                    className="flex items-start gap-2"
                                  >
                                    <span
                                      className="text-dental-primary-600 mt-0.5"
                                      aria-hidden="true"
                                    >
                                      •
                                    </span>
                                    <span className="flex-1">
                                      {it.services?.name_uk ??
                                        t('cabinet.consultation')}
                                      {it.quantity > 1
                                        ? ` ×${it.quantity}`
                                        : ''}
                                      {it.tooth_number
                                        ? ` (${t('cabinet.treatments.tooth')} ${it.tooth_number})`
                                        : ''}
                                    </span>
                                    {it.price_at_time > 0 && (
                                      <span className="text-dental-muted text-xs whitespace-nowrap">
                                        {Number(
                                          it.price_at_time * (it.quantity || 1)
                                        ).toLocaleString(dateLocale)}{' '}
                                        {t('cabinet.currency')}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                      {rec.tooth_numbers?.length > 0 && (
                        <p className="text-sm text-dental-muted">
                          <span className="font-medium text-dental-dark">
                            {t('cabinet.treatments.teeth')}:
                          </span>{' '}
                          {rec.tooth_numbers.join(', ')}
                        </p>
                      )}

                      {rec.notes && (
                        <p className="text-sm text-dental-muted italic">
                          {rec.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          {loadMoreError && (
            <p role="alert" className="text-sm text-red-700">
              {t('cabinet.treatments.loadMoreError')}
            </p>
          )}
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 rounded-xl border border-dental-secondary-200 text-dental-dark font-medium hover:bg-dental-secondary-50 disabled:opacity-50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-dental-primary-500"
          >
            {loadingMore && (
              <div
                className="w-4 h-4 border-2 border-dental-primary-600 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
            )}
            {loadMoreError
              ? t('asyncState.actions.retry')
              : t('cabinet.treatments.loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
