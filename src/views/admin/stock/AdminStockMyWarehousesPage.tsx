'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, AlertTriangle, Loader2 } from 'lucide-react'
import MaterialCard from '@/components/admin/stock/MaterialCard'
import ActionCart from '@/components/admin/stock/ActionCart'
import type {
  ActionCartHandle,
  DrawerType,
} from '@/components/admin/stock/ActionCart'
import { useCSRF } from '@/hooks/useCSRF'
import type { MaterialBalance, StockWarehouse } from '@/types/stock'

interface Category {
  id: string
  name_uk: string
  parent_id: string | null
}

export default function AdminStockMyWarehousesPage() {
  const { token: csrfToken } = useCSRF()
  const cartRef = useRef<ActionCartHandle>(null)

  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [balances, setBalances] = useState<MaterialBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 50

  useEffect(() => {
    Promise.all([
      fetch('/api/stock/warehouses').then(r => r.json()),
      fetch('/api/stock/categories').then(r => r.json()),
    ]).then(([w, c]) => {
      if (w.success) {
        setWarehouses(w.data)
        if (w.data.length > 0) setWarehouseId(w.data[0].id)
      }
      if (c.success) setCategories(c.data)
    })
  }, [])

  const loadBalances = useCallback(async () => {
    if (!warehouseId) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        warehouseId,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })
      if (search) params.set('q', search)
      if (categoryId) params.append('categoryIds', categoryId)
      if (criticalOnly) params.set('criticalOnly', 'true')

      const res = await fetch(`/api/stock/balances?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setBalances(json.data)
      setTotal(json.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [warehouseId, search, categoryId, criticalOnly, page])

  useEffect(() => {
    loadBalances()
  }, [loadBalances])

  function addToCart(type: DrawerType, balance: MaterialBalance) {
    cartRef.current?.addToCart(type, balance)
  }

  const topCategories = categories.filter(c => !c.parent_id)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className={'max-w-6xl mx-auto'}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/stock"
              className="text-dental-text hover:text-dental-primary-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
              Мої склади
            </h1>
          </div>

          {/* Warehouse picker */}
          <select
            value={warehouseId}
            onChange={e => {
              setWarehouseId(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name_uk}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          {/* Category sidebar */}
          <aside className="w-48 shrink-0 space-y-1">
            <button
              onClick={() => {
                setCategoryId(null)
                setPage(1)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-dental-primary/20 text-dental-primary-600 font-medium' : 'text-dental-text hover:bg-gray-100'}`}
            >
              Всі
            </button>
            {topCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryId(cat.id)
                  setPage(1)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryId === cat.id ? 'bg-dental-primary/20 text-dental-primary-600 font-medium' : 'text-dental-text hover:bg-gray-100'}`}
              >
                {cat.name_uk}
              </button>
            ))}
          </aside>

          {/* Main grid */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-text" />
                <input
                  type="text"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Пошук..."
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-dental-text cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={criticalOnly}
                  onChange={e => {
                    setCriticalOnly(e.target.checked)
                    setPage(1)
                  }}
                  className="rounded"
                />
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Критичні
              </label>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-dental-primary-600" />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && balances.length === 0 && (
              <p className="text-center text-dental-text py-12">
                Нічого не знайдено
              </p>
            )}

            {!loading && balances.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {balances.map(b => (
                  <MaterialCard
                    key={`${b.material_id}-${b.warehouse_id}`}
                    balance={b}
                    onWriteoff={bal => addToCart('writeoff', bal)}
                    onTransfer={bal => addToCart('transfer', bal)}
                    onRequisition={bal => addToCart('requisition', bal)}
                  />
                ))}
              </div>
            )}

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
        </div>
      </div>

      {/* Floating action cart */}
      {warehouseId && (
        <ActionCart
          ref={cartRef}
          warehouseId={warehouseId}
          csrfToken={csrfToken}
          onDocPosted={() => loadBalances()}
        />
      )}
    </>
  )
}
