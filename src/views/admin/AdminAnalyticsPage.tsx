'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Select } from '@/components/ui'
import { useAdminPreferences } from '@/hooks/useAdminPreferences'
import { useCSRF } from '@/hooks/useCSRF'
import { captureException } from '@/utils/sentry'
import ErrorBoundary from '@/components/ErrorBoundary'
import { formatCurrency } from './utils'

interface AnalyticsModel {
  totalAppointments: number
  completedAppointments: number
  pendingAppointments: number
  cancelledAppointments: number
  completionRate: number
  revenue: number
  averageTicket: number
  totalPatients: number
  unreadContacts: number
  pendingReviews: number
  timeline: Array<{ date: string; count: number; revenue: number }>
  sourceBreakdown: Array<{ name: string; count: number }>
  topServices: Array<{ name: string; count: number }>
}

interface AnalyticsApiResponse {
  success: boolean
  data?: AnalyticsModel
  error?: string
  message?: string
}

const PERIODS: Array<{ value: 7 | 30 | 90 }> = [
  { value: 7 },
  { value: 30 },
  { value: 90 },
]

function ChartErrorFallback() {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
      {t('admin.analyticsPage.errors.chartFailed')}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation()
  const { preferences } = useAdminPreferences()
  const { token: csrfToken, refreshToken } = useCSRF()
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30)
  const [model, setModel] = useState<AnalyticsModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPeriodDays(preferences.defaultAnalyticsPeriod)
  }, [preferences.defaultAnalyticsPeriod])

  const loadAnalytics = useCallback(
    async (silent = false, forceRefresh = false) => {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        if (forceRefresh) {
          const token =
            csrfToken ||
            (typeof window !== 'undefined'
              ? sessionStorage.getItem('csrf_token') || refreshToken()
              : '')

          if (!token) {
            throw new Error(t('admin.analyticsPage.errors.secureRefreshFailed'))
          }

          const refreshResponse = await fetch('/api/admin/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': token,
            },
            body: JSON.stringify({ action: 'refresh', periodDays }),
          })

          const refreshPayload = (await refreshResponse
            .json()
            .catch(() => null)) as AnalyticsApiResponse | null

          if (!refreshResponse.ok || !refreshPayload?.success) {
            throw new Error(
              refreshPayload?.error ||
                t('admin.analyticsPage.errors.refreshFailed')
            )
          }

          if (refreshPayload.data) {
            setModel(refreshPayload.data)
          }
        }

        const response = await fetch(
          `/api/admin/analytics?periodDays=${periodDays}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const payload = (await response
          .json()
          .catch(() => null)) as AnalyticsApiResponse | null

        if (!response.ok || !payload?.success || !payload.data) {
          throw new Error(
            payload?.error || t('admin.analyticsPage.errors.loadFailed')
          )
        }

        setModel(payload.data)
      } catch (loadError) {
        captureException(
          loadError instanceof Error ? loadError : new Error(String(loadError))
        )
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('admin.analyticsPage.errors.loadFailedFallback')
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [csrfToken, periodDays, refreshToken, t]
  )

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const maxDailyAppointments = useMemo(() => {
    if (!model || model.timeline.length === 0) return 1
    return Math.max(...model.timeline.map(item => item.count), 1)
  }, [model])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.analyticsPage.title')}
          </h1>
          <p className="text-sm text-dental-text-light">
            {t('admin.analyticsPage.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            selectSize="compact"
            value={periodDays}
            onChange={event =>
              setPeriodDays(Number(event.target.value) as 7 | 30 | 90)
            }
            aria-label={t('admin.analyticsPage.periodSelectAria')}
          >
            {PERIODS.map(period => (
              <option key={period.value} value={period.value}>
                {t(`admin.analyticsPage.periods.${period.value}`)}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAnalytics(true, true)}
            isLoading={isRefreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.analyticsPage.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading || !model ? (
        <div className="rounded-xl border border-dental-secondary-200 bg-white px-4 py-8 text-center text-dental-text-light">
          {t('admin.analyticsPage.loading')}
        </div>
      ) : (
        <>
          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <p className="text-xs text-dental-text-light">
                  {t('admin.analyticsPage.cards.appointments')}
                </p>
                <p className="text-2xl font-bold text-dental-dark">
                  {model.totalAppointments}
                </p>
              </div>
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <p className="text-xs text-dental-text-light">
                  {t('admin.analyticsPage.cards.completionRate')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {model.completionRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <p className="text-xs text-dental-text-light">
                  {t('admin.analyticsPage.cards.revenue')}
                </p>
                <p className="text-xl font-bold text-dental-dark">
                  {formatCurrency(model.revenue)}
                </p>
              </div>
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <p className="text-xs text-dental-text-light">
                  {t('admin.analyticsPage.cards.avgTicket')}
                </p>
                <p className="text-xl font-bold text-dental-dark">
                  {formatCurrency(model.averageTicket)}
                </p>
              </div>
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                <p className="text-xs text-dental-text-light">
                  {t('admin.analyticsPage.cards.patients')}
                </p>
                <p className="text-2xl font-bold text-dental-dark">
                  {model.totalPatients}
                </p>
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-dental-secondary-200 bg-white p-4 lg:col-span-2">
                <h2 className="text-lg font-semibold text-dental-dark">
                  {t('admin.analyticsPage.timeline.title')}
                </h2>
                <div className="mt-4 space-y-2">
                  {model.timeline.map(item => (
                    <div key={item.date}>
                      <div className="mb-1 flex items-center justify-between text-xs text-dental-text-light">
                        <span>{item.date}</span>
                        <span>
                          {t('admin.analyticsPage.timeline.appointmentsCount', {
                            count: item.count,
                          })}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-dental-primary-100">
                        <div
                          className="h-full rounded-full bg-dental-primary-600"
                          style={{
                            width: `${(item.count / maxDailyAppointments) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-dental-dark">
                    {t('admin.analyticsPage.statuses.title')}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-dental-text">
                    <li>
                      {t('admin.analyticsPage.statuses.pending')}:{' '}
                      {model.pendingAppointments}
                    </li>
                    <li>
                      {t('admin.analyticsPage.statuses.completed')}:{' '}
                      {model.completedAppointments}
                    </li>
                    <li>
                      {t('admin.analyticsPage.statuses.cancelledNoShow')}:{' '}
                      {model.cancelledAppointments}
                    </li>
                    <li>
                      {t('admin.analyticsPage.statuses.unreadContacts')}:{' '}
                      {model.unreadContacts}
                    </li>
                    <li>
                      {t('admin.analyticsPage.statuses.pendingReviews')}:{' '}
                      {model.pendingReviews}
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-dental-dark">
                    {t('admin.analyticsPage.sources.title')}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-dental-text">
                    {model.sourceBreakdown.length === 0 ? (
                      <li>{t('admin.analyticsPage.common.noData')}</li>
                    ) : (
                      model.sourceBreakdown.map(source => (
                        <li
                          key={source.name}
                          className="flex justify-between gap-2"
                        >
                          <span>{source.name}</span>
                          <span className="font-semibold">{source.count}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <div className="rounded-xl border border-dental-secondary-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-dental-dark">
                {t('admin.analyticsPage.topServices.title')}
              </h2>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {model.topServices.length === 0 ? (
                  <p className="text-sm text-dental-text-light">
                    {t('admin.analyticsPage.common.noData')}
                  </p>
                ) : (
                  model.topServices.map(service => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-lg bg-dental-primary-50 px-3 py-2 text-sm"
                    >
                      <span className="text-dental-text">{service.name}</span>
                      <span className="font-semibold text-dental-dark">
                        {service.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ErrorBoundary>
        </>
      )}
    </div>
  )
}
