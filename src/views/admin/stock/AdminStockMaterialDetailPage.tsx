'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Save, Archive, X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCSRF } from '@/hooks/useCSRF'
import { useConfirm } from '@/hooks/useConfirm'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { hasPermission } from '@/lib/permissions'
import BarcodeInput from '@/components/admin/stock/BarcodeInput'
import type { StockMaterial, MaterialWarehouseMatrix } from '@/types/stock'

interface Props {
  materialId: string | null
}

interface DirectoryItem {
  id: string
  name_uk?: string
  name?: string
}

const PACK_UNITS = [
  'шт',
  'г',
  'кг',
  'мл',
  'л',
  'см',
  'м',
  'пара',
  'набір',
] as const

export default function AdminStockMaterialDetailPage({ materialId }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const { confirm, confirmDialog } = useConfirm()
  const { user } = useAdminAuth()
  const canEdit = user ? hasPermission(user.role, 'inventory:edit') : false

  const isNew = !materialId

  const [material, setMaterial] = useState<StockMaterial | null>(null)
  const [matrix, setMatrix] = useState<MaterialWarehouseMatrix[]>([])
  const [brands, setBrands] = useState<DirectoryItem[]>([])
  const [categories, setCategories] = useState<DirectoryItem[]>([])
  const [suppliers, setSuppliers] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nameUk, setNameUk] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [unit, setUnit] = useState('шт')
  const [brandId, setBrandId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [packFormatLabel, setPackFormatLabel] = useState('')
  const [packSizeNumerator, setPackSizeNumerator] = useState('1')
  const [packSizeUnit, setPackSizeUnit] =
    useState<(typeof PACK_UNITS)[number]>('шт')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [articleCode, setArticleCode] = useState('')
  const [descriptionUk, setDescriptionUk] = useState('')

  const loadDirectories = useCallback(async () => {
    const [b, c, s] = await Promise.all([
      fetch('/api/stock/brands').then(r => r.json()),
      fetch('/api/stock/categories').then(r => r.json()),
      fetch('/api/stock/suppliers').then(r => r.json()),
    ])
    if (b.success) setBrands(b.data)
    if (c.success) setCategories(c.data)
    if (s.success) setSuppliers(s.data)
  }, [])

  useEffect(() => {
    loadDirectories()
  }, [loadDirectories])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    Promise.all([
      fetch(`/api/stock/materials/${materialId}`).then(r => r.json()),
      fetch(`/api/stock/materials/${materialId}/warehouse-matrix`).then(r =>
        r.json()
      ),
    ])
      .then(([m, mx]) => {
        if (!m.success) {
          setError(m.error)
          return
        }
        const mat: StockMaterial = m.data
        setMaterial(mat)
        setNameUk(mat.name_uk)
        setNameEn(mat.name_en ?? '')
        setUnit(mat.unit)
        setBrandId(mat.brand_id ?? '')
        setCategoryId(mat.category_v2_id ?? '')
        setSupplierId(mat.supplier_id ?? '')
        setPackFormatLabel(mat.pack_format_label ?? '')
        setPackSizeNumerator(String(mat.pack_size_numerator ?? 1))
        setPackSizeUnit(
          (mat.pack_size_unit ?? 'шт') as (typeof PACK_UNITS)[number]
        )
        setBarcodes(mat.barcodes ?? [])
        setArticleCode(mat.article_code ?? '')
        setDescriptionUk(mat.description_uk ?? '')
        if (mx.success) setMatrix(mx.data)
      })
      .catch(() => setError('Помилка завантаження'))
      .finally(() => setLoading(false))
  }, [materialId, isNew])

  function addBarcode() {
    const code = barcodeInput.trim()
    if (code && !barcodes.includes(code)) setBarcodes(prev => [...prev, code])
    setBarcodeInput('')
  }

  function removeBarcode(code: string) {
    setBarcodes(prev => prev.filter(b => b !== code))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameUk.trim()) {
      setError("Назва обов'язкова")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const url = isNew
        ? '/api/stock/materials'
        : `/api/stock/materials/${materialId}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          nameUk: nameUk.trim(),
          nameEn: nameEn.trim() || null,
          unit: unit.trim() || 'шт',
          brandId: brandId || null,
          categoryId: categoryId || null,
          supplierId: supplierId || null,
          packFormatLabel: packFormatLabel.trim() || null,
          packSizeNumerator: Number(packSizeNumerator) || 1,
          packSizeUnit,
          barcodes,
          articleCode: articleCode.trim() || null,
          descriptionUk: descriptionUk.trim() || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (isNew) router.push(`/admin/stock/materials/${json.data.id}`)
      else {
        setMaterial(json.data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!materialId) return
    if (
      !(await confirm({
        title: t('admin.stock.confirm.deactivateMaterial.title'),
        description: t('admin.stock.confirm.deactivateMaterial.description'),
        confirmLabel: t('admin.stock.confirm.deactivateMaterial.action'),
        severity: 'significant',
      }))
    )
      return
    const res = await fetch(`/api/stock/materials/${materialId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    const json = await res.json()
    if (json.success) router.push('/admin/stock/materials')
    else setError(json.error)
  }

  async function patchMatrix(
    warehouseId: string,
    patch: Record<string, unknown>
  ) {
    await fetch(`/api/stock/materials/${materialId}/warehouse-matrix`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ warehouseId, ...patch }),
    })
    const res = await fetch(
      `/api/stock/materials/${materialId}/warehouse-matrix`
    )
    const json = await res.json()
    if (json.success) setMatrix(json.data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-dental-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock/materials"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            {isNew ? 'Новий матеріал' : (material?.name_uk ?? 'Матеріал')}
          </h1>
        </div>
        {!isNew && canEdit && material && !material.is_active && (
          <button
            onClick={handleArchive}
            className="inline-flex items-center gap-2 rounded-lg border border-dental-warning/30 bg-status-warning-100 px-4 py-2 text-sm font-medium text-status-warning-700 hover:bg-dental-warning/20"
          >
            <Archive className="w-4 h-4" />
            Деактивувати
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-medium text-dental-dark">Основна інформація</h2>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              Назва (UA)*
            </label>
            <input
              value={nameUk}
              onChange={e => setNameUk(e.target.value)}
              required
              disabled={!canEdit}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Назва (EN)
              </label>
              <input
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Одиниця виміру
              </label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              Опис
            </label>
            <textarea
              value={descriptionUk}
              onChange={e => setDescriptionUk(e.target.value)}
              rows={2}
              disabled={!canEdit}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50 resize-none"
            />
          </div>
        </section>

        {/* Directories */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-medium text-dental-dark">Довідники</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Бренд
              </label>
              <select
                value={brandId}
                onChange={e => setBrandId(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              >
                <option value="">— не вказано —</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name_uk ?? b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Категорія
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              >
                <option value="">— не вказано —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name_uk ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Постачальник
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              >
                <option value="">— не вказано —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name_uk ?? s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Pack / Unit */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-medium text-dental-dark">Упаковка</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Формат упаковки
              </label>
              <input
                value={packFormatLabel}
                onChange={e => setPackFormatLabel(e.target.value)}
                disabled={!canEdit}
                placeholder="Банка, Флакон, Упаковка..."
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                К-сть в упаковці
              </label>
              <input
                type="number"
                min="0.0001"
                step="any"
                value={packSizeNumerator}
                onChange={e => setPackSizeNumerator(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Одиниця в уп.
              </label>
              <select
                value={packSizeUnit}
                onChange={e =>
                  setPackSizeUnit(e.target.value as (typeof PACK_UNITS)[number])
                }
                disabled={!canEdit}
                className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
              >
                {PACK_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Barcode / Article */}
        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-medium text-dental-dark">Штрихкоди та артикул</h2>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              Артикул
            </label>
            <input
              value={articleCode}
              onChange={e => setArticleCode(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 disabled:bg-dental-secondary-50"
            />
          </div>
          {canEdit && (
            <div>
              <label className="block text-sm font-medium text-dental-dark mb-1">
                Додати штрихкод
              </label>
              <div className="flex gap-2">
                <BarcodeInput
                  value={barcodeInput}
                  onChange={setBarcodeInput}
                  onScanned={code => {
                    if (!barcodes.includes(code))
                      setBarcodes(prev => [...prev, code])
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addBarcode}
                  className="rounded-lg border border-dental-primary-600 px-3 py-2 text-dental-primary-600 hover:bg-dental-primary/10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {barcodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {barcodes.map(code => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full bg-dental-secondary-100 px-3 py-1 text-sm text-dental-dark font-mono"
                >
                  {code}
                  {canEdit && (
                    <button type="button" onClick={() => removeBarcode(code)}>
                      <X className="w-3 h-3 text-dental-text hover:text-dental-error" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Per-warehouse matrix */}
        {!isNew && matrix.length > 0 && (
          <section className="rounded-xl border bg-white p-5">
            <h2 className="font-medium text-dental-dark mb-4">
              Матриця складів
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dental-secondary-200">
                    <th className="text-left py-2 font-medium text-dental-text">
                      Склад
                    </th>
                    <th className="text-right py-2 font-medium text-dental-text">
                      Залишок
                    </th>
                    <th className="text-right py-2 font-medium text-dental-text">
                      Критичний
                    </th>
                    <th className="text-right py-2 font-medium text-dental-text">
                      Замовлення
                    </th>
                    <th className="text-center py-2 font-medium text-dental-text">
                      Видно
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map(row => (
                    <tr
                      key={row.warehouse_id}
                      className="border-b border-dental-secondary-100"
                    >
                      <td className="py-2 text-dental-dark">
                        {row.warehouse?.name_uk ?? row.warehouse_id}
                      </td>
                      <td
                        className={`py-2 text-right font-mono ${(row.current_quantity ?? 0) <= 0 ? 'text-status-error-700' : 'text-dental-dark'}`}
                      >
                        {row.current_quantity ?? 0}
                      </td>
                      <td className="py-2 text-right">
                        {canEdit ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            defaultValue={row.critical_level_unit_qty ?? ''}
                            onBlur={e =>
                              patchMatrix(row.warehouse_id, {
                                criticalLevelUnitQty: e.target.value || null,
                              })
                            }
                            className="w-20 rounded border border-dental-secondary-300 px-2 py-1 text-right text-sm focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                          />
                        ) : (
                          <span className="text-dental-text">
                            {row.critical_level_unit_qty ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {canEdit ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            defaultValue={row.default_reorder_unit_qty ?? ''}
                            onBlur={e =>
                              patchMatrix(row.warehouse_id, {
                                defaultReorderUnitQty: e.target.value || null,
                              })
                            }
                            className="w-20 rounded border border-dental-secondary-300 px-2 py-1 text-right text-sm focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                          />
                        ) : (
                          <span className="text-dental-text">
                            {row.default_reorder_unit_qty ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.is_visible}
                          disabled={!canEdit}
                          onChange={e =>
                            patchMatrix(row.warehouse_id, {
                              isVisible: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {canEdit && (
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/stock/materials"
              className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
            >
              Скасувати
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Зберегти
            </button>
          </div>
        )}
      </form>

      {confirmDialog}
    </div>
  )
}
