'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Search,
  ClipboardList,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import CalcCardEditor from '@/components/admin/stock/CalcCardEditor'

interface ServiceRow {
  id: string
  name_uk: string
  category: string | null
  price_uah: number | null
  service_calculation_cards: Array<{
    id: string
    is_active: boolean
  }>
}

export default function AdminStockCalcCardsPage() {
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [editing, setEditing] = useState<{
    serviceId: string
    serviceName: string
    cardId: string | null
  } | null>(null)

  const PAGE_SIZE = 50

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
      })
      if (search) params.set('q', search)
      const res = await fetch(`/api/stock/calc-cards?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setServices(json.data)
      setTotal(json.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function cardBadge(row: ServiceRow) {
    if (!row.service_calculation_cards?.length) return null
    const card = row.service_calculation_cards[0]
    return card.is_active ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Активна
      </span>
    ) : (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Вимкнена
      </span>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/stock"
              className="text-dental-text hover:text-dental-primary-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
              Картки розрахунку
            </h1>
          </div>
          <p className="text-xs text-dental-text hidden sm:block">
            Норми витрат матеріалів на послугу
          </p>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-text" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Пошук послуги..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-white overflow-hidden">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-dental-primary-600" />
            </div>
          )}
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>
          )}
          {!loading && !error && services.length === 0 && (
            <p className="text-center text-dental-text py-12">
              Послуг не знайдено
            </p>
          )}
          {!loading && services.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-dental-text">
                    Послуга
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-dental-text hidden sm:table-cell">
                    Категорія
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-dental-text w-20 hidden sm:table-cell">
                    Ціна
                  </th>
                  <th className="px-4 py-3 w-28" />
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {services.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-dental-dark">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 shrink-0 text-dental-primary-600" />
                        {row.name_uk}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dental-text hidden sm:table-cell">
                      {row.category ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-dental-text hidden sm:table-cell">
                      {row.price_uah != null ? row.price_uah.toFixed(0) : '—'}
                    </td>
                    <td className="px-4 py-3">{cardBadge(row)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            serviceId: row.id,
                            serviceName: row.name_uk,
                            cardId:
                              row.service_calculation_cards?.[0]?.id ?? null,
                          })
                        }
                        className="rounded-lg border border-dental-text/20 px-3 py-1.5 text-xs font-medium text-dental-text hover:bg-gray-100 transition-colors"
                      >
                        Редагувати
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              ←
            </button>
            <span className="text-sm text-dental-text">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Card editor drawer */}
      {editing && (
        <CalcCardEditor
          serviceId={editing.serviceId}
          serviceName={editing.serviceName}
          cardId={editing.cardId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </>
  )
}
