'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Select } from '@/components/ui'
import { captureException } from '@/utils/sentry'
import { formatCurrency } from './utils'

const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), {
  ssr: false,
})
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), {
  ssr: false,
})
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), {
  ssr: false,
})
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), {
  ssr: false,
})
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), {
  ssr: false,
})
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), {
  ssr: false,
})
const ResponsiveContainer = dynamic(
  () => import('recharts').then(m => m.ResponsiveContainer),
  { ssr: false }
)

/* Тональна шкала бренду (Ф-1): 600/500/300/900 + secondary */
const COLORS = [
  '#3f6f79',
  '#7ba8b0',
  '#aeced3',
  '#2a3c40',
  '#d1cac0',
  '#c5dde1',
  '#ebe7e1',
]

const CATEGORY_KEYS: Record<string, string> = {
  composite: 'admin.materialsPage.categories.composite',
  filling: 'admin.materialsPage.categories.filling',
  instrument: 'admin.materialsPage.categories.instrument',
  implant: 'admin.materialsPage.categories.implant',
  hygiene: 'admin.materialsPage.categories.hygiene',
  anesthesia: 'admin.materialsPage.categories.anesthesia',
  other: 'admin.materialsPage.categories.other',
}

type AnalyticsData = {
  stockSummary: {
    totalMaterials: number
    lowStockCount: number
    totalSpent: number
    pendingOrders: number
  }
  spendingByCategory: Array<{ category: string; amount: number }>
  topConsumed: Array<{ name: string; total: number }>
  stockLevels: Array<{
    name: string
    category: string
    current: number
    min: number
  }>
  recentOrders: Array<{
    id: string
    total: number
    date: string
    orderedBy: string
  }>
}

export default function AdminInventoryAnalyticsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/inventory-analytics?period=${period}`)
      const json = (await res.json()) as {
        success?: boolean
        data?: AnalyticsData
        error?: string
      }
      if (!res.ok || !json.success || !json.data)
        throw new Error(json.error || t('common.error'))
      setData(json.data)
    } catch (e) {
      captureException(e instanceof Error ? e : new Error(String(e)))
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [period, t])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-dental-teal" />
        <span className="ml-3 text-dental-text">{t('common.loading')}</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-dental-error/20 bg-status-error-100 px-4 py-3 text-sm text-status-error-700">
          {error || t('common.error')}
        </div>
        <Button onClick={load} variant="outline">
          {t('asyncState.actions.retry')}
        </Button>
      </div>
    )
  }

  const { stockSummary, spendingByCategory, topConsumed, stockLevels } = data
  const pieData = spendingByCategory.map(s => ({
    name: CATEGORY_KEYS[s.category] ? t(CATEGORY_KEYS[s.category]) : s.category,
    value: Math.round(s.amount * 100) / 100,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/materials"
            className="rounded-lg p-2 text-dental-text hover:bg-dental-primary/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-nunito text-2xl font-bold text-dental-dark">
              {t('admin.inventory.analyticsTitle')}
            </h1>
            <p className="text-sm text-dental-text">
              {t('admin.inventory.analyticsSubtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            selectSize="compact"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            aria-label={t('admin.inventory.analyticsTitle')}
          >
            <option value="30">{t('admin.inventory.period30')}</option>
            <option value="90">{t('admin.inventory.period90')}</option>
            <option value="365">{t('admin.inventory.period365')}</option>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="border-dental-secondary-300"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            {t('admin.materialsPage.refresh')}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={<Package className="h-6 w-6" />}
          label={t('admin.inventory.kpi.totalMaterials')}
          value={String(stockSummary.totalMaterials)}
          color="text-dental-teal bg-dental-primary/30"
        />
        <KPICard
          icon={<AlertTriangle className="h-6 w-6" />}
          label={t('admin.inventory.kpi.lowStock')}
          value={String(stockSummary.lowStockCount)}
          color={
            stockSummary.lowStockCount > 0
              ? 'text-status-error-700 bg-status-error-100'
              : 'text-status-success-700 bg-status-success-100'
          }
        />
        <KPICard
          icon={<TrendingDown className="h-6 w-6" />}
          label={t('admin.inventory.kpi.totalSpent')}
          value={formatCurrency(stockSummary.totalSpent)}
          color="text-dental-navy bg-dental-secondary/30"
        />
        <KPICard
          icon={<ShoppingCart className="h-6 w-6" />}
          label={t('admin.inventory.kpi.pendingOrders')}
          value={String(stockSummary.pendingOrders)}
          color="text-dental-primary-ink bg-dental-primary-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by category */}
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4 shadow-xs">
          <h2 className="mb-4 font-semibold text-dental-dark">
            {t('admin.inventory.charts.spendingByCategory')}
          </h2>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-dental-muted">
              {t('admin.inventory.charts.noData')}
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({
                      name,
                      percent,
                    }: {
                      name?: string
                      percent?: number
                    }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top consumed */}
        <div className="rounded-xl border border-dental-secondary-200 bg-white p-4 shadow-xs">
          <h2 className="mb-4 font-semibold text-dental-dark">
            <BarChart3 className="mr-2 inline h-5 w-5 text-dental-teal" />
            {t('admin.inventory.charts.topConsumed')}
          </h2>
          {topConsumed.length === 0 ? (
            <p className="py-8 text-center text-dental-muted">
              {t('admin.inventory.charts.noData')}
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topConsumed}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={75}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3f6f79" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Stock levels table */}
      <div className="rounded-xl border border-dental-secondary-200 bg-white shadow-xs">
        <div className="border-b border-dental-secondary-100 px-4 py-3">
          <h2 className="font-semibold text-dental-dark">
            {t('admin.inventory.stockLevels')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dental-secondary-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-dental-muted">
                  {t('admin.inventory.stockColumns.material')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-dental-muted">
                  {t('admin.inventory.stockColumns.category')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-dental-muted">
                  {t('admin.inventory.stockColumns.stock')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-dental-muted">
                  {t('admin.inventory.stockColumns.level')}
                </th>
              </tr>
            </thead>
            <tbody>
              {stockLevels.slice(0, 20).map((s, i) => {
                const pct =
                  s.min > 0 ? Math.min(100, (s.current / s.min) * 100) : 100
                const low = s.current < s.min
                return (
                  <tr
                    key={i}
                    className={`border-t border-dental-secondary-100 ${low ? 'bg-status-error-100/60' : ''}`}
                  >
                    <td className="px-4 py-2 font-medium text-dental-dark">
                      <span className="inline-flex items-center gap-1">
                        {s.name}
                        {low && (
                          <AlertTriangle className="h-3.5 w-3.5 text-dental-error" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-dental-text">
                      {CATEGORY_KEYS[s.category]
                        ? t(CATEGORY_KEYS[s.category])
                        : s.category}
                    </td>
                    <td className="px-4 py-2 text-dental-text">
                      {s.current} / {s.min}
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-2 w-24 rounded-full bg-dental-secondary-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct < 50
                              ? 'bg-dental-error'
                              : pct < 80
                                ? 'bg-dental-warning'
                                : 'bg-dental-success'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dental-secondary-200 bg-white p-4 shadow-xs">
      <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-dental-dark">{value}</p>
        <p className="text-sm text-dental-text">{label}</p>
      </div>
    </div>
  )
}
