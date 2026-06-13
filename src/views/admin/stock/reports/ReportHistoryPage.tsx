'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Download } from 'lucide-react'
import { PeriodFilter } from '@/components/admin/stock/ReportFilterBar'
import { exportCsv } from '@/utils/stock-export'
import type { StockWarehouse } from '@/types/stock'

interface HistoryRow {
  event_at: string
  doc_type: string
  doc_number: string
  qty_delta: number
  unit_cost: number
  running_balance: number
  actor: string | null
  comment: string | null
}

interface MaterialOption {
  id: string
  name_uk: string
}

function defaultPeriod() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export default function ReportHistoryPage() {
  const p = defaultPeriod()
  const [from, setFrom] = useState(p.from)
  const [to, setTo] = useState(p.to)
  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([])
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMeta() {
      const [whRes, matRes] = await Promise.all([
        fetch('/api/stock/warehouses?archived=false'),
        fetch('/api/stock/materials?page=1'),
      ])
      const [whJson, matJson] = await Promise.all([whRes.json(), matRes.json()])
      if (whJson.success) setWarehouses(whJson.data ?? [])
      if (matJson.success) setMaterials(matJson.data ?? [])
    }
    fetchMeta()
  }, [])

  const run = useCallback(async () => {
    if (!materialId || !warehouseId) {
      setError('Оберіть матеріал та склад')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams({ materialId, warehouseId, from, to })
      const res = await fetch(`/api/stock/reports/history?${sp}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRows(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [materialId, warehouseId, from, to])

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
          Історія товару
        </h1>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <PeriodFilter
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
        <select
          value={materialId}
          onChange={e => setMaterialId(e.target.value)}
          className="rounded-lg border border-dental-secondary-200 px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 bg-white rounded-xl"
        >
          <option value="">— Матеріал —</option>
          {materials.map(m => (
            <option key={m.id} value={m.id}>
              {m.name_uk}
            </option>
          ))}
        </select>
        <select
          value={warehouseId}
          onChange={e => setWarehouseId(e.target.value)}
          className="rounded-lg border border-dental-secondary-200 px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 bg-white rounded-xl"
        >
          <option value="">— Склад —</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>
              {w.name_uk}
            </option>
          ))}
        </select>
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
                'history.csv'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-dental-secondary-200 px-3 py-2 text-sm text-dental-text hover:bg-dental-secondary-50"
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
              <tr className="border-b border-dental-secondary-200 bg-dental-secondary-50">
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Дата
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Тип
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Документ
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-24">
                  Δ К-сть
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-24">
                  Ціна
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                  Залишок
                </th>
                <th className="text-left px-4 py-3 font-medium text-dental-text hidden md:table-cell">
                  Хто
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-dental-secondary-100 last:border-0"
                >
                  <td className="px-4 py-2 text-dental-text text-xs">
                    {new Date(row.event_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-2 text-dental-text">{row.doc_type}</td>
                  <td className="px-4 py-2 font-mono text-dental-primary-600">
                    {row.doc_number}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono ${row.qty_delta > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {row.qty_delta > 0 ? '+' : ''}
                    {row.qty_delta}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-dental-text">
                    {row.unit_cost}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-dental-dark">
                    {row.running_balance}
                  </td>
                  <td className="px-4 py-2 text-dental-text hidden md:table-cell">
                    {row.actor ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && rows.length === 0 && (
        <p className="text-center text-dental-text py-12">
          Оберіть матеріал, склад та натисніть «Побудувати»
        </p>
      )}
    </div>
  )
}
