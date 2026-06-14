'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Search,
  Loader2,
  Package,
  ChevronRight,
} from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { hasPermission } from '@/lib/permissions'
import type { StockMaterial } from '@/types/stock'

interface Category {
  id: string
  name_uk: string
  parent_id: string | null
  is_archived: boolean
}

export default function AdminStockMaterialsPage() {
  const { user } = useAdminAuth()
  const canEdit = user ? hasPermission(user.role, 'inventory:edit') : false

  const [materials, setMaterials] = useState<StockMaterial[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      if (categoryId) params.set('categoryId', categoryId)
      if (showInactive) params.set('includeArchived', 'true')
      const res = await fetch(`/api/stock/materials?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setMaterials(json.data)
      setTotal(json.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, showInactive, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/stock/categories')
      .then(r => r.json())
      .then(j => {
        if (j.success) setCategories(j.data)
      })
      .catch(() => {})
  }, [])

  const topCategories = categories.filter(c => !c.parent_id && !c.is_archived)
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Матеріали
          </h1>
        </div>
        {canEdit && (
          <Link
            href="/admin/stock/materials/new"
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Додати матеріал
          </Link>
        )}
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <aside className="w-52 shrink-0 space-y-1">
          <button
            onClick={() => {
              setCategoryId(null)
              setPage(1)
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-dental-primary/20 text-dental-primary-600 font-medium' : 'text-dental-text hover:bg-gray-100'}`}
          >
            Всі категорії
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

        {/* Main content */}
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
                placeholder="Пошук за назвою..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-dental-text cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => {
                  setShowInactive(e.target.checked)
                  setPage(1)
                }}
                className="rounded"
              />
              Неактивні
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

          {!loading && !error && materials.length === 0 && (
            <p className="text-center text-dental-text py-12">
              Матеріалів не знайдено
            </p>
          )}

          {!loading && materials.length > 0 && (
            <div className="space-y-2">
              {materials.map(mat => (
                <Link
                  key={mat.id}
                  href={`/admin/stock/materials/${mat.id}`}
                  className={`flex items-center gap-4 rounded-xl border bg-white p-4 hover:bg-gray-50 transition-colors ${!mat.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/10">
                    {mat.image_url ? (
                      <Image
                        src={mat.image_url}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-dental-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dental-dark truncate">
                      {mat.name_uk}
                    </p>
                    <p className="text-xs text-dental-text">
                      {mat.unit}
                      {mat.article_code && ` · Арт: ${mat.article_code}`}
                      {mat.barcodes?.length > 0 &&
                        ` · Штрихкод: ${mat.barcodes[0]}`}
                      {!mat.is_active && ' · Неактивний'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dental-text shrink-0" />
                </Link>
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
                {page} / {totalPages} ({total})
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
  )
}
