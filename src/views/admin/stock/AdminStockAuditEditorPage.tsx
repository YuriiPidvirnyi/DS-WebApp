'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, CheckCircle2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCSRF } from '@/hooks/useCSRF'
import { useConfirm } from '@/hooks/useConfirm'
import type { InventoryAuditWithItems, InventoryAuditItem } from '@/types/stock'

interface Props {
  auditId: string
}

export default function AdminStockAuditEditorPage({ auditId }: Props) {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const { confirm, confirmDialog } = useConfirm()
  const [audit, setAudit] = useState<InventoryAuditWithItems | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [saved, setSaved] = useState(false)
  // Local qty_actual edits pending save
  const [pendingUpdates, setPendingUpdates] = useState<
    Map<string, number | null>
  >(new Map())
  const [savingItems, setSavingItems] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/audits/${auditId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudit(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [auditId])

  useEffect(() => {
    load()
  }, [load])

  function getDisplayQty(item: InventoryAuditItem): number | null {
    if (pendingUpdates.has(item.id)) return pendingUpdates.get(item.id) ?? null
    return item.qty_actual ?? null
  }

  function handleQtyChange(itemId: string, value: string) {
    const num = value === '' ? null : parseFloat(value)
    setPendingUpdates(prev => new Map(prev).set(itemId, num))
    setSaved(false)
  }

  async function handleSaveItems() {
    if (!audit || pendingUpdates.size === 0) return
    setSavingItems(true)
    setError(null)
    try {
      const itemUpdates = Array.from(pendingUpdates.entries()).map(
        ([itemId, qtyActual]) => ({ itemId, qtyActual })
      )
      const res = await fetch(`/api/stock/audits/${auditId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ itemUpdates }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPendingUpdates(new Map())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження')
    } finally {
      setSavingItems(false)
    }
  }

  async function handleAutofill() {
    setAutofilling(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/audits/${auditId}/autofill`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPendingUpdates(new Map())
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка автозаповнення')
    } finally {
      setAutofilling(false)
    }
  }

  async function handlePost() {
    if (
      !(await confirm({
        title: t('admin.stock.confirm.postAudit.title'),
        description: t('admin.stock.confirm.postAudit.description'),
        confirmLabel: t('admin.stock.confirm.postAudit.action'),
        severity: 'irreversible',
        warning: t('confirmDialog.irreversibleWarning'),
      }))
    )
      return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/audits/${auditId}/post`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка проведення')
    } finally {
      setPosting(false)
    }
  }

  function deltaClass(item: InventoryAuditItem): string {
    const qty = getDisplayQty(item)
    if (qty == null) return ''
    const d = qty - item.qty_before
    if (d > 0) return 'bg-status-success-100'
    if (d < 0) return 'bg-status-error-100'
    return ''
  }

  function deltaLabel(item: InventoryAuditItem): ReactNode {
    const qty = getDisplayQty(item)
    if (qty == null) return <span className="text-dental-secondary-300">—</span>
    const d = qty - item.qty_before
    if (d === 0) return <span className="text-dental-text">0</span>
    return (
      <span
        className={
          d > 0
            ? 'text-status-success-700 font-medium'
            : 'text-status-error-700 font-medium'
        }
      >
        {d > 0 ? '+' : ''}
        {d.toFixed(4).replace(/\.?0+$/, '')}
      </span>
    )
  }

  const isDraft = audit?.status === 'draft'
  const hasPending = pendingUpdates.size > 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/stock/audits"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
              {audit?.audit_number ?? 'Інвентаризація'}
            </h1>
            {audit && (
              <p className="text-xs text-dental-text mt-0.5">
                {audit.audit_date}
                {audit.status !== 'draft' && (
                  <span
                    className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      audit.status === 'posted'
                        ? 'bg-status-success-100 text-status-success-700'
                        : 'bg-dental-secondary-100 text-dental-muted'
                    }`}
                  >
                    {audit.status === 'posted' ? 'Проведено' : 'Анульовано'}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {isDraft && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutofill}
              disabled={autofilling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm text-dental-text hover:bg-dental-secondary-100 transition-colors disabled:opacity-50"
            >
              {autofilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Заповнити автоматично
            </button>

            {hasPending && (
              <button
                type="button"
                onClick={handleSaveItems}
                disabled={savingItems || saved}
                className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
              >
                {savingItems && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved && <CheckCircle2 className="w-4 h-4" />}
                {saved ? 'Збережено' : 'Зберегти'}
              </button>
            )}

            <button
              type="button"
              onClick={handlePost}
              disabled={posting || hasPending}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-success px-4 py-2 text-sm font-medium text-white hover:bg-dental-success-dark disabled:opacity-60 transition-colors"
              title={hasPending ? 'Спочатку збережіть зміни' : undefined}
            >
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              Провести
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-dental-primary-600" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
          {error}
        </div>
      )}

      {!loading && audit && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {audit.items.length === 0 ? (
            <p className="text-center text-dental-text py-12">
              Позицій немає — поверніться і ініціалізуйте знову
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dental-secondary-200 bg-dental-secondary-50">
                  <th className="text-left px-4 py-3 font-medium text-dental-text">
                    Матеріал
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-dental-text hidden sm:table-cell">
                    Склад
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-dental-text w-28">
                    Залишок
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-dental-text w-32">
                    Фактично
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-dental-text w-24">
                    Різниця
                  </th>
                </tr>
              </thead>
              <tbody>
                {audit.items.map(item => (
                  <tr
                    key={item.id}
                    className={`border-b border-dental-secondary-100 last:border-0 transition-colors ${deltaClass(item)}`}
                  >
                    <td className="px-4 py-2.5 text-dental-dark">
                      <p className="truncate max-w-[200px]">
                        {item.material?.name_uk ?? item.material_id}
                      </p>
                      <p className="text-xs text-dental-text">
                        {item.material?.unit ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-dental-text hidden sm:table-cell">
                      {item.warehouse?.name_uk ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-dental-text">
                      {item.qty_before}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isDraft ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={getDisplayQty(item) ?? ''}
                          onChange={e =>
                            handleQtyChange(item.id, e.target.value)
                          }
                          placeholder="—"
                          className="w-24 rounded border border-dental-secondary-300 px-2 py-1 text-right text-sm focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                        />
                      ) : (
                        <span className="font-mono">
                          {item.qty_actual ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {deltaLabel(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
