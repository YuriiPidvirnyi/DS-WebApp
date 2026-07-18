'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/hooks/useConfirm'
import BarcodeInput from './BarcodeInput'
import type {
  DocType,
  StockWarehouse,
  StockDocumentWithItems,
} from '@/types/stock'

interface Material {
  id: string
  name_uk: string
  unit: string
  article_code?: string | null
}
interface Supplier {
  id: string
  name?: string
}

interface Props {
  doc: StockDocumentWithItems
  warehouses: StockWarehouse[]
  csrfToken: string
  onPosted?: () => void
  onDeleted?: () => void
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  incoming: 'Прихідна',
  writeoff: 'Списання',
  transfer: 'Переміщення',
  return: 'Повернення',
  adjustment: 'Коректування',
}

export default function InvoiceEditor({
  doc,
  warehouses,
  csrfToken,
  onPosted,
  onDeleted,
}: Props) {
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirm()
  const [items, setItems] = useState(doc.items ?? [])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [matSearch, setMatSearch] = useState('')
  const [matResults, setMatResults] = useState<Material[]>([])
  const [searching, setSearching] = useState(false)
  const [posting, setPosting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posted, setPosted] = useState(doc.status === 'posted')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDraft = doc.status === 'draft'

  useEffect(() => {
    fetch('/api/stock/suppliers')
      .then(r => r.json())
      .then(j => {
        if (j.success) setSuppliers(j.data)
      })
  }, [])

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
        if (json.success) setMatResults(json.data.slice(0, 10))
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  useEffect(() => {
    searchMaterials(matSearch)
  }, [matSearch, searchMaterials])

  async function handleBarcodeScanned(code: string) {
    const res = await fetch(
      `/api/stock/materials/by-barcode?code=${encodeURIComponent(code)}`
    )
    const json = await res.json()
    if (json.success) await addItem(json.data)
  }

  async function addItem(mat: Material) {
    if (!isDraft) return
    setMatSearch('')
    setMatResults([])
    const res = await fetch(`/api/stock/documents/${doc.id}/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ materialId: mat.id, unitQty: 1 }),
    })
    const json = await res.json()
    if (json.success) setItems(prev => [...prev, json.data])
    else setError(json.error)
  }

  async function removeItem(itemId: string) {
    if (!isDraft) return
    const res = await fetch(`/api/stock/documents/${doc.id}/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    const json = await res.json()
    if (json.success) setItems(prev => prev.filter(i => i.id !== itemId))
    else setError(json.error)
  }

  async function updateItemQty(itemId: string, qty: number) {
    if (!isDraft || qty <= 0) return
    // Update locally first for instant feedback
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, unit_qty: qty } : i))
    )
    // Then push full items array
    const updated = items.map(i =>
      i.id === itemId ? { ...i, unit_qty: qty } : i
    )
    await fetch(`/api/stock/documents/${doc.id}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        items: updated.map(i => ({
          materialId: i.material_id,
          unitQty: i.unit_qty,
          unitCost: i.unit_cost,
        })),
      }),
    })
  }

  async function handlePost() {
    if (!isDraft || items.length === 0) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/documents/${doc.id}/post`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPosted(true)
      onPosted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка проведення')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete() {
    if (!isDraft) return
    if (
      !(await confirm({
        title: t('admin.stock.confirm.deleteDocument.title'),
        description: t('admin.stock.confirm.deleteDocument.description'),
        confirmLabel: t('admin.stock.confirm.deleteDocument.action'),
        severity: 'irreversible',
      }))
    )
      return
    setDeleting(true)
    try {
      const res = await fetch(`/api/stock/documents/${doc.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onDeleted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка видалення')
    } finally {
      setDeleting(false)
    }
  }

  const needsSupplier = doc.doc_type === 'incoming' || doc.doc_type === 'return'
  const needsFrom =
    doc.doc_type === 'transfer' ||
    doc.doc_type === 'writeoff' ||
    doc.doc_type === 'return' ||
    doc.doc_type === 'adjustment'
  const needsTo =
    doc.doc_type === 'transfer' ||
    doc.doc_type === 'incoming' ||
    doc.doc_type === 'adjustment'

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dental-dark">
            {DOC_TYPE_LABELS[doc.doc_type as DocType] ?? doc.doc_type} &nbsp;
            <span className="font-mono text-sm text-dental-text">
              {doc.doc_number ?? doc.id.slice(0, 8)}
            </span>
          </h2>
          {posted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-100 px-3 py-1 text-sm font-medium text-status-success-700">
              <CheckCircle2 className="w-4 h-4" />
              Проведено
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {needsSupplier && (
            <div>
              <p className="text-dental-text mb-1">Постачальник</p>
              <p className="font-medium text-dental-dark">
                {suppliers.find(s => s.id === doc.supplier_id)?.name ??
                  doc.supplier_id ??
                  '—'}
              </p>
            </div>
          )}
          {needsFrom && doc.warehouse_from_id && (
            <div>
              <p className="text-dental-text mb-1">З складу</p>
              <p className="font-medium text-dental-dark">
                {warehouses.find(w => w.id === doc.warehouse_from_id)
                  ?.name_uk ?? doc.warehouse_from_id}
              </p>
            </div>
          )}
          {needsTo && doc.warehouse_to_id && (
            <div>
              <p className="text-dental-text mb-1">На склад</p>
              <p className="font-medium text-dental-dark">
                {warehouses.find(w => w.id === doc.warehouse_to_id)?.name_uk ??
                  doc.warehouse_to_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {isDraft && (
          <div className="border-b border-dental-secondary-100 p-4 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dental-text" />
                <input
                  type="text"
                  value={matSearch}
                  onChange={e => setMatSearch(e.target.value)}
                  placeholder="Пошук матеріалу..."
                  className="w-full rounded-lg border border-dental-secondary-300 pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-dental-text" />
                )}
              </div>
              <BarcodeInput
                value=""
                onChange={() => {}}
                onScanned={handleBarcodeScanned}
                placeholder="Штрихкод..."
                className="w-48"
              />
            </div>
            {matResults.length > 0 && (
              <div className="rounded-lg border border-dental-secondary-200 bg-white shadow-xs max-h-48 overflow-y-auto">
                {matResults.map(mat => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => addItem(mat)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-dental-secondary-50 text-left"
                  >
                    <Plus className="w-4 h-4 shrink-0 text-dental-primary-600" />
                    <span className="font-medium text-dental-dark">
                      {mat.name_uk}
                    </span>
                    <span className="text-dental-text ml-auto">{mat.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-center text-dental-text py-12">Позицій немає</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dental-secondary-200 bg-dental-secondary-50">
                <th className="text-left px-4 py-3 font-medium text-dental-text">
                  Матеріал
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                  К-сть
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                  Ціна
                </th>
                <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                  Сума
                </th>
                {isDraft && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  className="border-b border-dental-secondary-100 last:border-0"
                >
                  <td className="px-4 py-3 text-dental-dark">
                    {item.material_id}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isDraft ? (
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        defaultValue={item.unit_qty}
                        onBlur={e =>
                          updateItemQty(item.id, Number(e.target.value))
                        }
                        className="w-24 rounded border border-dental-secondary-300 px-2 py-1 text-right text-sm focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                      />
                    ) : (
                      <span className="font-mono">{item.unit_qty}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-dental-text">
                    {item.unit_cost != null ? item.unit_cost.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-dental-dark">
                    {item.line_total != null ? item.line_total.toFixed(2) : '—'}
                  </td>
                  {isDraft && (
                    <td className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded p-1 text-dental-text hover:text-status-error-700 hover:bg-status-error-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {doc.total_amount != null && (
              <tfoot>
                <tr className="border-t border-dental-secondary-200 bg-dental-secondary-50">
                  <td
                    colSpan={isDraft ? 3 : 2}
                    className="px-4 py-3 text-sm font-medium text-dental-dark"
                  >
                    Разом
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-dental-dark font-mono">
                    {doc.total_amount.toFixed(2)}
                  </td>
                  {isDraft && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
          {error}
        </div>
      )}

      {isDraft && (
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-dental-error/20 px-4 py-2 text-sm font-medium text-status-error-700 hover:bg-status-error-100 disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Видалити чернетку
          </button>
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || items.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
          >
            {posting && <Loader2 className="w-4 h-4 animate-spin" />}
            Провести
          </button>
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
