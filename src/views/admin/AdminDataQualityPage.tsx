'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui'
import type { ReactElement } from 'react'

interface DataQualityIssue {
  key: string
  label: string
  count: number
  severity: 'high' | 'medium' | 'low'
  hint: string
}

interface DataQualityResponse {
  success: boolean
  issues?: DataQualityIssue[]
  totalIssues?: number
  checkedAt?: string
  error?: string
}

const SEVERITY_ICON: Record<DataQualityIssue['severity'], ReactElement> = {
  high: <AlertCircle className="h-5 w-5 text-dental-error" />,
  medium: <AlertTriangle className="h-5 w-5 text-dental-warning" />,
  low: <Info className="h-5 w-5 text-dental-info" />,
}

const SEVERITY_BADGE: Record<DataQualityIssue['severity'], string> = {
  high: 'bg-status-error-100 text-status-error-700 border-dental-error/20',
  medium:
    'bg-status-warning-100 text-status-warning-700 border-dental-warning/30',
  low: 'bg-dental-info-light text-dental-info-dark border-dental-info/30',
}

const SEVERITY_LABEL: Record<DataQualityIssue['severity'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function IssueCard({ issue }: { issue: DataQualityIssue }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-dental-secondary-200 shadow-xs">
      <div className="mt-0.5 shrink-0">{SEVERITY_ICON[issue.severity]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-dental-dark text-sm">{issue.label}</p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${SEVERITY_BADGE[issue.severity]}`}
          >
            {SEVERITY_LABEL[issue.severity]}
          </span>
        </div>
        <p className="text-xs text-dental-text mt-1">{issue.hint}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-2xl font-bold text-dental-dark">
          {issue.count}
        </span>
      </div>
    </div>
  )
}

export default function AdminDataQualityPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<DataQualityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/data-quality')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as DataQualityResponse
      setData(json)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load data quality'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const checkedAt = data?.checkedAt
    ? new Date(data.checkedAt).toLocaleTimeString('uk-UA')
    : null

  const hasIssues = (data?.issues?.length ?? 0) > 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dental-dark">
            {t('admin.dataQuality.title', 'Data Quality')}
          </h1>
          {checkedAt && (
            <p className="text-xs text-dental-text mt-1">
              {t('admin.dataQuality.lastChecked', 'Last checked')}: {checkedAt}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.dataQuality.refresh', 'Refresh')}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-status-error-100 border border-dental-error/20 rounded-lg text-sm text-status-error-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="mb-4 p-3 rounded-lg border text-sm font-medium flex items-center gap-2">
          {!hasIssues ? (
            <>
              <CheckCircle className="h-4 w-4 text-dental-success" />
              <span className="text-status-success-700">
                {t(
                  'admin.dataQuality.allClean',
                  'No data quality issues found'
                )}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-dental-error" />
              <span className="text-status-error-700">
                {t('admin.dataQuality.issuesFound', {
                  count: data.totalIssues,
                  defaultValue: `${data.totalIssues} issue(s) require attention`,
                })}
              </span>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-dental-secondary-100 rounded-xl animate-pulse"
              />
            ))
          : data?.issues?.map(issue => (
              <IssueCard key={issue.key} issue={issue} />
            ))}
      </div>

      {!loading && data && !hasIssues && (
        <div className="mt-8 text-center">
          <CheckCircle className="h-12 w-12 text-dental-success mx-auto mb-3" />
          <p className="text-dental-text text-sm">
            {t(
              'admin.dataQuality.cleanDescription',
              'Your clinic data is clean and consistent.'
            )}
          </p>
        </div>
      )}
    </div>
  )
}
