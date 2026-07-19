'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Trash2, Loader2, Search, CheckCircle2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import { useTranslation } from 'react-i18next'

interface Material {
  id: string
  name_uk: string
  unit: string
}

interface CardItem {
  id?: string
  material_id: string
  default_unit_qty: number
  is_replaceable: boolean
  materials?: Material
}

interface CalcCard {
  id: string
  service_id: string
  is_active: boolean
  service_calculation_card_items: CardItem[]
}

interface Props {
  serviceId: string
  serviceName: string
  cardId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function CalcCardEditor({
  serviceId,
  serviceName,
  cardId,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const [items, setItems] = useState<CardItem[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [matSearch, setMatSearch] = useState('')
  const [matResults, setMatResults] = useState<Material[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load existing card
  useEffect(() => {
    if (!cardId) return
    setLoading(true)
    fetch(`/api/stock/calc-cards/${cardId}`)
      .then(r => r.json())
      .then((j: { success: boolean; data?: CalcCard }) => {
        if (j.success && j.data) {
          setItems(j.data.service_calculation_card_items ?? [])
          setIsActive(j.data.is_active)
        }
      })
      .finally(() => setLoading(false))
  }, [cardId])

  const searchMaterials = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) {
      setMatResults([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `/api/stock/materials?search=${encodeURIComponent(q)}&page=1`
        )
        const json = await res.json()
        if (json.success) setMatResults((json.data as Material[]).slice(0, 10))
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  useEffect(() => {
    searchMaterials(matSearch)
  }, [matSearch, searchMaterials])

  function addMaterial(mat: Material) {
    if (items.find(i => i.material_id === mat.id)) return
    setItems(prev => [
      ...prev,
      {
        material_id: mat.id,
        default_unit_qty: 1,
        is_replaceable: true,
        materials: mat,
      },
    ])
    setMatSearch('')
    setMatResults([])
  }

  function removeItem(materialId: string) {
    setItems(prev => prev.filter(i => i.material_id !== materialId))
  }

  function updateQty(materialId: string, qty: number) {
    setItems(prev =>
      prev.map(i =>
        i.material_id === materialId ? { ...i, default_unit_qty: qty } : i
      )
    )
  }

  function toggleReplaceable(materialId: string) {
    setItems(prev =>
      prev.map(i =>
        i.material_id === materialId
          ? { ...i, is_replaceable: !i.is_replaceable }
          : i
      )
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        isActive,
        items: items.map(i => ({
          materialId: i.material_id,
          defaultUnitQty: i.default_unit_qty,
          isReplaceable: i.is_replaceable,
        })),
      }

      let res: Response
      if (cardId) {
        res = await fetch(`/api/stock/calc-cards/${cardId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/stock/calc-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ serviceId, ...payload }),
        })
      }

      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSaved(true)
      setTimeout(() => {
        onSaved()
        onClose()
      }, 800)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('admin.stock.calcCardEditor.saveError')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dental-secondary-200 bg-dental-secondary-50">
          <div>
            <p className="text-xs text-dental-text">
              {t('admin.stock.calcCardEditor.title')}
            </p>
            <h2 className="font-semibold text-dental-dark text-sm leading-tight mt-0.5">
              {serviceName}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-dental-text cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded"
              />
              {t('admin.stock.calcCardEditor.active')}
            </label>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 hover:bg-dental-secondary-200 transition-colors"
            >
              <X className="w-4 h-4 text-dental-text" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-dental-primary-600" />
            </div>
          )}

          {!loading && (
            <>
              {/* Search */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-dental-text">
                  {t('admin.stock.calcCardEditor.addMaterial')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-text" />
                  <input
                    type="text"
                    value={matSearch}
                    onChange={e => setMatSearch(e.target.value)}
                    placeholder={t(
                      'admin.stock.calcCardEditor.searchPlaceholder'
                    )}
                    className="w-full rounded-lg border border-dental-secondary-300 pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-dental-text" />
                  )}
                </div>
                {matResults.length > 0 && (
                  <div className="rounded-lg border border-dental-secondary-200 bg-white shadow-xs max-h-44 overflow-y-auto">
                    {matResults.map(mat => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => addMaterial(mat)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-dental-secondary-50 text-left"
                      >
                        <Plus className="w-4 h-4 shrink-0 text-dental-primary-600" />
                        <span className="font-medium text-dental-dark">
                          {mat.name_uk}
                        </span>
                        <span className="text-dental-text ml-auto">
                          {mat.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items table */}
              {items.length === 0 ? (
                <p className="text-center text-dental-text text-sm py-8">
                  {t('admin.stock.calcCardEditor.emptyState')}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dental-secondary-200 text-left">
                      <th className="pb-2 font-medium text-dental-text">
                        {t('admin.stock.calcCardEditor.materialColumn')}
                      </th>
                      <th className="pb-2 font-medium text-dental-text w-24 text-right">
                        {t('admin.stock.calcCardEditor.quantityColumn')}
                      </th>
                      <th className="pb-2 font-medium text-dental-text w-20 text-center text-xs">
                        {t('admin.stock.calcCardEditor.replacementColumn')}
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const mat = item.materials
                      const name = mat?.name_uk ?? item.material_id
                      const unit = mat?.unit ?? ''
                      return (
                        <tr
                          key={item.material_id}
                          className="border-b border-dental-secondary-100 last:border-0"
                        >
                          <td className="py-2 pr-2 text-dental-dark">
                            <span
                              className="truncate block max-w-[180px]"
                              title={name}
                            >
                              {name}
                            </span>
                            <span className="text-xs text-dental-text">
                              {unit}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={item.default_unit_qty}
                              onChange={e =>
                                updateQty(
                                  item.material_id,
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 rounded border border-dental-secondary-300 px-2 py-1 text-right text-sm focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.is_replaceable}
                              onChange={() =>
                                toggleReplaceable(item.material_id)
                              }
                              title={t(
                                'admin.stock.calcCardEditor.allowReplacement'
                              )}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 pl-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.material_id)}
                              className="rounded p-1 text-dental-text hover:text-status-error-700 hover:bg-status-error-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {error && (
                <div className="rounded-lg bg-status-error-100 border border-dental-error/20 p-3 text-sm text-status-error-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-dental-secondary-200 bg-dental-secondary-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-dental-secondary-300 px-4 py-2 text-sm font-medium text-dental-text hover:bg-dental-secondary-100 transition-colors"
          >
            {t('admin.stock.calcCardEditor.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && <CheckCircle2 className="w-4 h-4" />}
            {saved
              ? t('admin.stock.calcCardEditor.saved')
              : t('admin.stock.calcCardEditor.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
