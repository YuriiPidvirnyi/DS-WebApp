'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Download } from 'lucide-react'
import { SelectFilter } from '@/components/admin/stock/ReportFilterBar'
import { exportCsv } from '@/utils/stock-export'

interface BalanceRow {
  material_id: string
  material_name: string
  category: string | null
  brand: string | null
  unit: string | null
  warehouse_id: string
  warehouse_name: string
  qty: number
  critical_level: number | null
  status: 'ok' | 'critical' | 'out'
  weighted_avg_cost: number | null
}

const STATUS_CLASSES: Record<string, string> = {
  ok: 'text-status-success-700',
  critical: 'text-status-warning-700 font-medium',
  out: 'text-status-error-700 font-bold',
}

export default function ReportBalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balanceState, setBalanceState] = useState('all')
  const [criticalOnly, setCriticalOnly] = useState(false)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams({ balanceState })
      if (criticalOnly) sp.set('criticalOnly', 'true')
      const res = await fetch(`/api/stock/reports/balances?${sp}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRows(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [balanceState, criticalOnly])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/stock/reports"
          className="text-dental-text hover:text-dental-primary-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
          Залишки
        </h1>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <SelectFilter
          label="Залишки"
          value={balanceState}
          onChange={setBalanceState}
          options={[
            { value: 'all', label: 'Всі' },
            { value: 'positive', label: '> 0' },
            { value: 'negative', label: '< 0' },
            { value: 'zero', label: '= 0' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-dental-text cursor-pointer">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={e => setCriticalOnly(e.target.checked)}
            className="rounded"
          />
          Лише критичні
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Побудувати
        </button>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() =>
              exportCsv(
                rows as unknown as Record<string, unknown>[],
                'balances.csv'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm text-dental-text hover:bg-dental-secondary-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dental-secondary-200 bg-dental-secondary-50">
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Матеріал
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden md:table-cell">
                  Категорія
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden lg:table-cell">
                  Склад
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                  К-сть
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28 hidden md:table-cell">
                  Ліміт
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28 hidden lg:table-cell">
                  Ср. ціна
                </th>
                <th className="text-center px-4 py-3 font-medium text-dental-text w-24">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.material_id}-${row.warehouse_id}-${i}`}
                  className="border-b border-dental-secondary-100 last:border-0 hover:bg-dental-secondary-50"
                >
                  <td className="px-4 py-2.5 text-dental-dark">
                    <p className="truncate max-w-[200px]">
                      {row.material_name}
                    </p>
                    {row.brand && (
                      <p className="text-xs text-dental-text">{row.brand}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dental-text hidden md:table-cell">
                    {row.category ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-dental-text hidden lg:table-cell">
                    {row.warehouse_name}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {row.qty}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-dental-text hidden md:table-cell">
                    {row.critical_level ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-dental-text hidden lg:table-cell">
                    {row.weighted_avg_cost != null
                      ? row.weighted_avg_cost.toFixed(2)
                      : '—'}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-center text-xs ${STATUS_CLASSES[row.status] ?? ''}`}
                  >
                    {row.status === 'ok'
                      ? 'OK'
                      : row.status === 'critical'
                        ? 'Критично'
                        : 'Нуль'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-center text-dental-text py-12">
          Натисніть «Побудувати» для отримання звіту
        </p>
      )}
    </div>
  )
}
