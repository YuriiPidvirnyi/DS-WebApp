'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Download } from 'lucide-react'
import {
  PeriodFilter,
  exportCsv,
} from '@/components/admin/stock/ReportFilterBar'

interface WriteoffRow {
  doc_id: string
  doc_number: string
  posted_at: string
  warehouse: string
  doctor: string | null
  service: string | null
  material: string
  unit_qty: number
  unit_cost: number
  line_total: number
}

function defaultPeriod() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export default function ReportWriteoffPage() {
  const p = defaultPeriod()
  const [from, setFrom] = useState(p.from)
  const [to, setTo] = useState(p.to)
  const [rows, setRows] = useState<WriteoffRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams({ from, to })
      const res = await fetch(`/api/stock/reports/writeoff?${sp}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRows(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  const totalAmount = rows.reduce((s, r) => s + r.line_total, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/stock/reports"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Звіт по списанню
          </h1>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
          <PeriodFilter
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
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
                  'writeoff.csv'
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
          <>
            <div className="mb-3 text-sm text-dental-text">
              Рядків: <strong>{rows.length}</strong> · Сума:{' '}
              <strong>{totalAmount.toFixed(2)} грн</strong>
            </div>
            <div className="rounded-xl border bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-dental-text">
                      Документ
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-dental-text hidden sm:table-cell">
                      Дата
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-dental-text hidden md:table-cell">
                      Склад
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-dental-text">
                      Матеріал
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-dental-text hidden lg:table-cell">
                      Послуга
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-dental-text w-20">
                      К-сть
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                      Сума
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 font-mono text-dental-primary-600">
                        {row.doc_number}
                      </td>
                      <td className="px-4 py-2 text-dental-text text-xs hidden sm:table-cell">
                        {new Date(row.posted_at).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="px-4 py-2 text-dental-text hidden md:table-cell">
                        {row.warehouse}
                      </td>
                      <td className="px-4 py-2 text-dental-dark">
                        {row.material}
                      </td>
                      <td className="px-4 py-2 text-dental-text hidden lg:table-cell">
                        {row.service ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.unit_qty}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-center text-dental-text py-12">
            Оберіть період та натисніть «Побудувати»
          </p>
        )}
      </div>
    </div>
  )
}
