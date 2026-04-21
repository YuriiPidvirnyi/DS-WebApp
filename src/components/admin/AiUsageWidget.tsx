'use client'

import { useEffect, useState } from 'react'
import { captureException } from '@/utils/sentry'

interface AiUsageData {
  totals: {
    inputTokens: number
    outputTokens: number
    costUsd: number
    requests: number
  }
  daily: Array<{
    date: string
    requests: number
    costUsd: number
    tokens: number
  }>
  byRoute: Array<{ route: string; requests: number; costUsd: number }>
}

interface AiUsageResponse {
  success: boolean
  data?: AiUsageData
  error?: string
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function AiUsageWidget() {
  const [data, setData] = useState<AiUsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/ai-usage?days=30', {
          cache: 'no-store',
        })
        const payload = (await res
          .json()
          .catch(() => null)) as AiUsageResponse | null
        if (!res.ok || !payload?.success || !payload.data) {
          throw new Error(payload?.error ?? 'Failed to load AI usage')
        }
        setData(payload.data)
      } catch (err) {
        captureException(err instanceof Error ? err : new Error(String(err)))
        setError(err instanceof Error ? err.message : 'Failed to load AI usage')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="rounded-xl border border-dental-secondary/30 bg-white p-4">
      <h2 className="text-lg font-semibold text-dental-dark">
        AI Usage (last 30 days)
      </h2>

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : isLoading ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-dental-secondary/20"
            />
          ))}
        </div>
      ) : data ? (
        <div className="mt-3 space-y-4">
          {/* Totals row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: 'Requests',
                value: data.totals.requests.toLocaleString(),
              },
              {
                label: 'Input tokens',
                value: (data.totals.inputTokens / 1000).toFixed(1) + 'k',
              },
              {
                label: 'Output tokens',
                value: (data.totals.outputTokens / 1000).toFixed(1) + 'k',
              },
              { label: 'Cost (USD)', value: '$' + fmt(data.totals.costUsd) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg bg-dental-primary-50 px-3 py-2"
              >
                <p className="text-xs text-dental-text/60">{label}</p>
                <p className="mt-0.5 text-lg font-semibold text-dental-dark">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* By route */}
          {data.byRoute.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-dental-text/60 uppercase tracking-wide">
                By route
              </p>
              <div className="space-y-1">
                {data.byRoute.map(r => (
                  <div
                    key={r.route}
                    className="flex items-center justify-between rounded-lg bg-dental-secondary-50 px-3 py-1.5 text-sm"
                  >
                    <span className="font-mono text-xs text-dental-dark">
                      {r.route}
                    </span>
                    <span className="text-dental-text/60">
                      {r.requests} req · ${fmt(r.costUsd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last 7 days mini-table */}
          {data.daily.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-dental-text/60 uppercase tracking-wide">
                Last 7 days
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dental-secondary/30 text-left text-dental-text/50">
                      <th className="pb-1.5 font-medium">Date</th>
                      <th className="pb-1.5 font-medium">Requests</th>
                      <th className="pb-1.5 font-medium">Tokens</th>
                      <th className="pb-1.5 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dental-secondary/20">
                    {data.daily
                      .slice(-7)
                      .reverse()
                      .map(d => (
                        <tr key={d.date} className="text-dental-text">
                          <td className="py-1.5 text-dental-text/60">
                            {d.date}
                          </td>
                          <td className="py-1.5">{d.requests}</td>
                          <td className="py-1.5">
                            {(d.tokens / 1000).toFixed(1)}k
                          </td>
                          <td className="py-1.5">${fmt(d.costUsd)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
