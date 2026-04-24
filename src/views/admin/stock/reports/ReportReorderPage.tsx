'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Download } from 'lucide-react'
import { exportCsv } from '@/utils/stock-export'

interface ReorderRow {
  supplier_id: string | null
  supplier_name: string | null
  material_id: string
  material_name: string
  category: string | null
  warehouse_id: string
  warehouse_name: string
  qty: number
  critical_level: number | null
  suggested_order_qty: number
}

export default function ReportReorderPage() {
  const [rows, setRows] = useState<ReorderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stock/reports/reorder')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRows(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }

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
          Замовлення з критичним залишком
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border bg-white p-4">
        <p className="text-sm text-dental-text flex-1">
          Матеріали, де поточний залишок нижче критичного ліміту. Пропонована
          кількість замовлення = дефолтне або ліміт × 2.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
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
                'reorder.csv'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-dental-text hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Матеріал
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden md:table-cell">
                  Постачальник
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden md:table-cell">
                  Склад
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-24">
                  Залишок
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-24">
                  Ліміт
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-32 text-dental-primary-600">
                  Замовити
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5 text-dental-dark">
                    <p>{row.material_name}</p>
                    {row.category && (
                      <p className="text-xs text-dental-text">{row.category}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dental-text hidden md:table-cell">
                    {row.supplier_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-dental-text hidden md:table-cell">
                    {row.warehouse_name}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    {row.qty}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-dental-text">
                    {row.critical_level ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-dental-primary-600">
                    {row.suggested_order_qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-center text-dental-text py-12">
          Натисніть «Побудувати» для перевірки критичних залишків
        </p>
      )}
    </div>
  )
}
