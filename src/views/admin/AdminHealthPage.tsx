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
import type { ReactElement } from 'react'

type ServiceStatus = 'ok' | 'error' | 'unconfigured'

interface ServiceHealth {
  name: string
  status: ServiceStatus
  latencyMs: number | null
  message?: string
}

interface HealthResponse {
  success: boolean
  ok: boolean
  services: ServiceHealth[]
  checkedAt: string
}

const STATUS_ICON: Record<ServiceStatus, ReactElement> = {
  ok: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  unconfigured: <MinusCircle className="h-5 w-5 text-gray-400" />,
}

const STATUS_BADGE_CLASS: Record<ServiceStatus, string> = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  unconfigured: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ok: 'OK',
  error: 'Error',
  unconfigured: 'Not configured',
}

function ServiceCard({ service }: { service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
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
        {service.latencyMs !== null && (
          <span className="flex items-center gap-1 text-xs text-dental-text">
            <Clock className="h-3 w-3" />
            {service.latencyMs}ms
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

export default function AdminHealthPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as HealthResponse
      setData(json)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load health status'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const checkedAt = data?.checkedAt
    ? new Date(data.checkedAt).toLocaleTimeString('uk-UA')
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.health.title', 'Service Health')}
          </h1>
          {checkedAt && (
            <p className="text-xs text-dental-text mt-1">
              {t('admin.health.lastChecked', 'Last checked')}: {checkedAt}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.health.refresh', 'Refresh')}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="mb-4 p-3 rounded-lg border text-sm font-medium flex items-center gap-2">
          {data.ok ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700">
                {t('admin.health.allOk', 'All services operational')}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">
                {t('admin.health.degraded', 'One or more services have errors')}
              </span>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading && !data
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-lg animate-pulse"
              />
            ))
          : data?.services.map(s => <ServiceCard key={s.name} service={s} />)}
      </div>
    </div>
  )
}
