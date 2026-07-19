'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCSRF } from '@/hooks/useCSRF'
import type { StockWarehouse } from '@/types/stock'

interface CategoryRow {
  id: string
  name_uk: string
}

interface BrandRow {
  id: string
  name_uk: string
}

export default function AdminStockAuditNewPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { token: csrfToken } = useCSRF()

  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [brands, setBrands] = useState<BrandRow[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<string>>(
    new Set()
  )
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [auditDate, setAuditDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [comment, setComment] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMeta() {
      setLoadingMeta(true)
      try {
        const [whRes, catRes, brandRes] = await Promise.all([
          fetch('/api/stock/warehouses?archived=false'),
          fetch('/api/stock/categories'),
          fetch('/api/stock/brands'),
        ])
        const [whJson, catJson, brandJson] = await Promise.all([
          whRes.json(),
          catRes.json(),
          brandRes.json(),
        ])
        if (whJson.success) setWarehouses(whJson.data ?? [])
        if (catJson.success) setCategories(catJson.data ?? [])
        if (brandJson.success) setBrands(brandJson.data ?? [])
      } finally {
        setLoadingMeta(false)
      }
    }
    fetchMeta()
  }, [])

  function toggleSet(set: Set<string>, id: string): Set<string> {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  async function handleCreate() {
    if (selectedWarehouses.size === 0) {
      setError(t('admin.stock.auditNewPage.errorSelectWarehouse'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/stock/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          warehouseIds: Array.from(selectedWarehouses),
          categoryIds: Array.from(selectedCategories),
          brandIds: Array.from(selectedBrands),
          materialIds: [],
          auditDate,
          comment: comment.trim() || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      // Auto-initialise items after creation
      await fetch(`/api/stock/audits/${json.data.id}/init`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })

      router.push(`/admin/stock/audits/${json.data.id}`)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('admin.stock.auditNewPage.errorCreate')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/stock/audits"
          className="text-dental-text hover:text-dental-primary-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
          {t('admin.stock.auditNewPage.title')}
        </h1>
      </div>

      {loadingMeta ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-dental-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Date */}
          <div className="rounded-xl border bg-white p-5">
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.auditNewPage.auditDate')}
            </label>
            <input
              type="date"
              value={auditDate}
              onChange={e => setAuditDate(e.target.value)}
              className="rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            />
          </div>

          {/* Warehouses */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold text-dental-dark mb-3">
              {t('admin.stock.auditNewPage.warehouses')}{' '}
              <span className="text-dental-error">*</span>
            </h2>
            {warehouses.length === 0 ? (
              <p className="text-sm text-dental-text">
                {t('admin.stock.auditNewPage.noWarehouses')}
              </p>
            ) : (
              <div className="space-y-2">
                {warehouses.map(wh => (
                  <label
                    key={wh.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWarehouses.has(wh.id)}
                      onChange={() =>
                        setSelectedWarehouses(
                          toggleSet(selectedWarehouses, wh.id)
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-dental-dark">
                      {wh.name_uk}
                    </span>
                    <span className="text-xs text-dental-text">{wh.kind}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Categories (optional filter) */}
          {categories.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold text-dental-dark mb-1">
                {t('admin.stock.auditNewPage.categories')}{' '}
                <span className="text-xs text-dental-text font-normal">
                  {t('admin.stock.auditNewPage.categoriesHint')}
                </span>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                      selectedCategories.has(cat.id)
                        ? 'border-dental-primary-600 bg-dental-primary/10 text-dental-primary-600'
                        : 'border-dental-secondary-200 text-dental-text hover:bg-dental-secondary-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedCategories.has(cat.id)}
                      onChange={() =>
                        setSelectedCategories(
                          toggleSet(selectedCategories, cat.id)
                        )
                      }
                    />
                    {cat.name_uk}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Brands (optional filter) */}
          {brands.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold text-dental-dark mb-1">
                {t('admin.stock.auditNewPage.brands')}{' '}
                <span className="text-xs text-dental-text font-normal">
                  {t('admin.stock.auditNewPage.brandsHint')}
                </span>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {brands.map(brand => (
                  <label
                    key={brand.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                      selectedBrands.has(brand.id)
                        ? 'border-dental-primary-600 bg-dental-primary/10 text-dental-primary-600'
                        : 'border-dental-secondary-200 text-dental-text hover:bg-dental-secondary-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedBrands.has(brand.id)}
                      onChange={() =>
                        setSelectedBrands(toggleSet(selectedBrands, brand.id))
                      }
                    />
                    {brand.name_uk}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="rounded-xl border bg-white p-5">
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.auditNewPage.comment')}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={t('admin.stock.auditNewPage.commentPlaceholder')}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/stock/audits"
              className="rounded-lg border border-dental-secondary-300 px-4 py-2 text-sm font-medium text-dental-text hover:bg-dental-secondary-100 transition-colors"
            >
              {t('admin.stock.auditNewPage.cancel')}
            </Link>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || selectedWarehouses.size === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('admin.stock.auditNewPage.create')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
