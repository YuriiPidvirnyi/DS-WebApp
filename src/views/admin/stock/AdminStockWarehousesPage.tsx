'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Pencil, Archive, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { StockWarehouse, WarehouseKind } from '@/types/stock'
import { useCSRF } from '@/hooks/useCSRF'
import { useConfirm } from '@/hooks/useConfirm'

const KIND_LABEL_KEYS: Record<WarehouseKind, string> = {
  main: 'admin.stock.warehousesPage.kindMain',
  cabinet: 'admin.stock.warehousesPage.kindCabinet',
  doctor: 'admin.stock.warehousesPage.kindDoctor',
  other: 'admin.stock.warehousesPage.kindOther',
}

export default function AdminStockWarehousesPage() {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const { confirm, confirmDialog } = useConfirm()
  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState<StockWarehouse | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/stock/warehouses${showArchived ? '?includeArchived=true' : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setWarehouses(json.data)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('admin.stock.warehousesPage.loadError')
      )
    } finally {
      setLoading(false)
    }
  }, [showArchived, t])

  useEffect(() => {
    load()
  }, [load])

  async function archiveWarehouse(id: string) {
    if (
      !(await confirm({
        title: t('admin.stock.confirm.archiveWarehouse.title'),
        description: t('admin.stock.confirm.archiveWarehouse.description'),
        confirmLabel: t('admin.stock.confirm.archiveWarehouse.action'),
        severity: 'significant',
      }))
    )
      return
    const res = await fetch(`/api/stock/warehouses/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ isArchived: true }),
    })
    if (res.ok) load()
  }

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            {t('admin.stock.warehousesPage.title')}
          </h1>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-dental-text cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded"
            />
            {t('admin.stock.warehousesPage.showArchived')}
          </label>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.stock.warehousesPage.addWarehouse')}
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-dental-primary-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-status-error-100 border border-dental-error/20 p-4 text-sm text-status-error-700">
            {error}
          </div>
        )}

        {!loading && !error && warehouses.length === 0 && (
          <p className="text-center text-dental-text py-12">
            {t('admin.stock.warehousesPage.emptyState')}
          </p>
        )}

        {!loading && warehouses.length > 0 && (
          <div className="space-y-2">
            {warehouses.map(wh => (
              <div
                key={wh.id}
                className={`flex items-center justify-between rounded-xl border bg-white p-4 ${wh.is_archived ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-dental-dark">{wh.name_uk}</p>
                    <p className="text-xs text-dental-text">
                      {t(KIND_LABEL_KEYS[wh.kind])}
                      {wh.is_main &&
                        ` ${t('admin.stock.warehousesPage.mainTag')}`}
                      {wh.is_archived &&
                        ` ${t('admin.stock.warehousesPage.archivedTag')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditTarget(wh)}
                    className="rounded p-1.5 text-dental-text hover:bg-dental-secondary-100"
                    title={t('admin.stock.warehousesPage.editTitle')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!wh.is_archived && (
                    <button
                      onClick={() => archiveWarehouse(wh.id)}
                      className="rounded p-1.5 text-dental-warning hover:bg-status-warning-100"
                      title={t('admin.stock.warehousesPage.archiveTitle')}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editTarget) && (
        <WarehouseFormModal
          warehouse={editTarget}
          onClose={() => {
            setCreating(false)
            setEditTarget(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditTarget(null)
            load()
          }}
        />
      )}

      {confirmDialog}
    </>
  )
}

interface WarehouseFormModalProps {
  warehouse: StockWarehouse | null
  onClose: () => void
  onSaved: () => void
}

const VALID_KINDS: WarehouseKind[] = ['main', 'cabinet', 'doctor', 'other']

function WarehouseFormModal({
  warehouse,
  onClose,
  onSaved,
}: WarehouseFormModalProps) {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const [nameUk, setNameUk] = useState(warehouse?.name_uk ?? '')
  const [kind, setKind] = useState<WarehouseKind>(warehouse?.kind ?? 'cabinet')
  const [comment, setComment] = useState(warehouse?.comment ?? '')
  const [sortOrder, setSortOrder] = useState(warehouse?.sort_order ?? 0)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameUk.trim()) {
      setErr(t('admin.stock.warehousesPage.nameRequired'))
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const url = warehouse
        ? `/api/stock/warehouses/${warehouse.id}`
        : '/api/stock/warehouses'
      const method = warehouse ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          nameUk: nameUk.trim(),
          kind,
          comment,
          sortOrder,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved()
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : t('admin.stock.warehousesPage.saveError')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-dental-dark mb-4">
          {warehouse
            ? t('admin.stock.warehousesPage.editWarehouse')
            : t('admin.stock.warehousesPage.newWarehouse')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.warehousesPage.nameUkLabel')}
            </label>
            <input
              value={nameUk}
              onChange={e => setNameUk(e.target.value)}
              required
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.warehousesPage.typeLabel')}
            </label>
            <select
              value={kind}
              onChange={e => setKind(e.target.value as WarehouseKind)}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            >
              {VALID_KINDS.map(k => (
                <option key={k} value={k}>
                  {t(KIND_LABEL_KEYS[k])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.warehousesPage.sortOrderLabel')}
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dental-dark mb-1">
              {t('admin.stock.warehousesPage.commentLabel')}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 resize-none"
            />
          </div>
          {err && <p className="text-sm text-status-error-700">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
            >
              {t('admin.stock.warehousesPage.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('admin.stock.warehousesPage.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
