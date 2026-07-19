'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/ui'
import { captureException } from '@/utils/sentry'

interface CronRunSummary {
  name: string
  last_started_at: string | null
  last_status: 'ok' | 'error' | 'running' | null
  last_processed: number | null
  last_error: string | null
  runs_24h: number
  errors_24h: number
}

interface CronHealthResponse {
  success: boolean
  data?: CronRunSummary[]
  error?: string
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function CronStatusBadge({
  status,
}: {
  status: CronRunSummary['last_status']
}) {
  if (!status) {
    return (
      <StatusBadge tone="neutral">
        <Clock className="h-3 w-3" />
        Never
      </StatusBadge>
    )
  }
  if (status === 'ok') {
    return (
      <StatusBadge tone="success">
        <CheckCircle className="h-3 w-3" />
        OK
      </StatusBadge>
    )
  }
  if (status === 'error') {
    return (
      <StatusBadge tone="error">
        <XCircle className="h-3 w-3" />
        Error
      </StatusBadge>
    )
  }
  return (
    <StatusBadge tone="warning">
      <AlertTriangle className="h-3 w-3" />
      Running
    </StatusBadge>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-3 py-2.5">
          <div className="h-4 animate-pulse rounded bg-dental-secondary/30" />
        </td>
      ))}
    </tr>
  )
}

export default function CronHealthWidget() {
  const [data, setData] = useState<CronRunSummary[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/cron-health', { cache: 'no-store' })
        const payload = (await res
          .json()
          .catch(() => null)) as CronHealthResponse | null
        if (!res.ok || !payload?.success || !payload.data) {
          throw new Error(payload?.error ?? 'Failed to load cron health')
        }
        setData(payload.data)
      } catch (err) {
        captureException(err instanceof Error ? err : new Error(String(err)))
        setError(
          err instanceof Error ? err.message : 'Failed to load cron health'
        )
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="rounded-xl border border-dental-secondary/30 bg-white p-4">
      <h2 className="text-lg font-semibold text-dental-dark">Cron Jobs</h2>

      {error ? (
        <p className="mt-3 text-sm text-status-error-700">{error}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dental-secondary/30 text-left text-xs text-dental-text/60">
                <th className="px-3 pb-2 font-medium">Job</th>
                <th className="px-3 pb-2 font-medium">Last run</th>
                <th className="px-3 pb-2 font-medium">Status</th>
                <th className="px-3 pb-2 font-medium">Processed</th>
                <th className="px-3 pb-2 font-medium">Errors (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dental-secondary/30">
              {isLoading
                ? Array.from({ length: 3 }, (_, i) => <SkeletonRow key={i} />)
                : data?.map(row => (
                    <tr key={row.name} className="text-dental-text">
                      <td className="px-3 py-2.5 font-mono text-xs text-dental-dark">
                        {row.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-dental-text/60">
                        {relativeTime(row.last_started_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <CronStatusBadge status={row.last_status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {row.last_processed ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {row.errors_24h > 0 ? (
                          <span className="font-semibold text-status-error-700">
                            {row.errors_24h}
                          </span>
                        ) : (
                          <span className="text-dental-text/40">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
