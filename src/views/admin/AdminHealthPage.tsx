'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { captureException } from '@/utils/sentry'
import type { ReactElement } from 'react'

type ServiceStatus = 'ok' | 'degraded' | 'error' | 'unknown'

interface ServiceResult {
  name: string
  status: ServiceStatus
  latency?: number
  message?: string
}

interface RawHealthPayload {
  ok?: boolean
  error?: string
  latency?: number
}

const STATUS_ICON: Record<ServiceStatus, ReactElement> = {
  ok: <CheckCircle className="h-5 w-5 text-dental-success" />,
  degraded: <MinusCircle className="h-5 w-5 text-dental-warning" />,
  error: <XCircle className="h-5 w-5 text-dental-error" />,
  unknown: <MinusCircle className="h-5 w-5 text-dental-muted" />,
}

const STATUS_BADGE_CLASS: Record<ServiceStatus, string> = {
  ok: 'bg-status-success-100 text-status-success-700 border-dental-success/30',
  degraded:
    'bg-status-warning-100 text-status-warning-700 border-dental-warning/30',
  error: 'bg-status-error-100 text-status-error-700 border-dental-error/20',
  unknown:
    'bg-dental-secondary-50 text-dental-muted border-dental-secondary-200',
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ok: 'OK',
  degraded: 'Degraded',
  error: 'Error',
  unknown: 'Unknown',
}

function ServiceCard({ service }: { service: ServiceResult }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-dental-secondary-200 shadow-xs">
      <div className="flex items-center gap-3">
        {STATUS_ICON[service.status]}
        <div>
          <p className="font-medium text-dental-dark text-sm">{service.name}</p>
          {service.message && (
            <p className="text-xs text-dental-text mt-0.5">{service.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className="flex items-center gap-1 text-xs text-dental-text">
            <Clock className="h-3 w-3" />
            {service.latency}ms
          </span>
        )}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border ${STATUS_BADGE_CLASS[service.status]}`}
        >
          {STATUS_LABEL[service.status]}
        </span>
      </div>
    </div>
  )
}

async function fetchEndpoint(
  name: string,
  url: string
): Promise<ServiceResult> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const json = (await res.json()) as RawHealthPayload
    if (!res.ok || json.ok === false) {
      return {
        name,
        status: 'error',
        latency: json.latency,
        message: json.error ?? `HTTP ${res.status}`,
      }
    }
    return { name, status: 'ok', latency: json.latency }
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return { name, status: 'unknown', message: 'Network error' }
  }
}

export default function AdminHealthPage() {
  const { t } = useTranslation()
  const [services, setServices] = useState<ServiceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Check Sentry client-side (no network call needed)
      const sentryConfigured = Boolean(
        typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN
      )
      const sentryResult: ServiceResult = {
        name: 'Sentry',
        status: sentryConfigured ? 'ok' : 'unknown',
        message: sentryConfigured
          ? 'DSN configured'
          : 'NEXT_PUBLIC_SENTRY_DSN not set',
      }

      const [supabase, resend, redis, clinicards] = await Promise.allSettled([
        fetchEndpoint('Supabase', '/api/admin/health/supabase'),
        fetchEndpoint('Resend', '/api/admin/health/resend'),
        fetchEndpoint('Upstash Redis', '/api/admin/health/redis'),
        fetchEndpoint('CliniCards', '/api/admin/health/clinicards'),
      ])

      const results: ServiceResult[] = [
        supabase.status === 'fulfilled'
          ? supabase.value
          : { name: 'Supabase', status: 'unknown', message: 'Check failed' },
        resend.status === 'fulfilled'
          ? resend.value
          : { name: 'Resend', status: 'unknown', message: 'Check failed' },
        redis.status === 'fulfilled'
          ? redis.value
          : {
              name: 'Upstash Redis',
              status: 'unknown',
              message: 'Check failed',
            },
        clinicards.status === 'fulfilled'
          ? clinicards.value
          : { name: 'CliniCards', status: 'unknown', message: 'Check failed' },
        sentryResult,
      ]

      setServices(results)
      setCheckedAt(new Date().toLocaleTimeString('uk-UA'))
    } catch (err) {
      captureException(err instanceof Error ? err : new Error(String(err)))
      setError(
        err instanceof Error ? err.message : 'Failed to load health status'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHealth()
  }, [fetchHealth])

  const allOk = services.length > 0 && services.every(s => s.status === 'ok')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.health.title', 'Service Health')}
          </h1>
          {checkedAt && (
            <p className="text-sm text-dental-muted mt-0.5">
              {t('admin.health.lastChecked', 'Last checked')}: {checkedAt}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchHealth()}
          isLoading={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.health.refresh', 'Refresh')}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-dental-error/20 bg-status-error-100 px-4 py-3 text-sm text-status-error-700">
          {error}
        </div>
      )}

      {!loading && services.length > 0 && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            allOk
              ? 'bg-status-success-100 border-dental-success/30'
              : 'bg-status-error-100 border-dental-error/20'
          }`}
        >
          {allOk ? (
            <>
              <CheckCircle className="h-4 w-4 text-dental-success" />
              <span className="text-status-success-700">
                {t('admin.health.allOk', 'All services operational')}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-dental-error" />
              <span className="text-status-error-700">
                {t('admin.health.degraded', 'One or more services have issues')}
              </span>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading && services.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-dental-secondary-100 rounded-xl animate-pulse"
              />
            ))
          : services.map(s => <ServiceCard key={s.name} service={s} />)}
      </div>
    </div>
  )
}
