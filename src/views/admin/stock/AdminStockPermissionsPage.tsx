'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCSRF } from '@/hooks/useCSRF'
import { useConfirm } from '@/hooks/useConfirm'
import type {
  StockWarehousePermission,
  StockWarehouse,
  WarehousePermissionFlags,
} from '@/types/stock'

const FLAG_LABEL_KEYS: Record<keyof WarehousePermissionFlags, string> = {
  manage_warehouses: 'admin.stock.permissionsPage.flagManageWarehouses',
  edit_brands: 'admin.stock.permissionsPage.flagEditBrands',
  edit_products: 'admin.stock.permissionsPage.flagEditProducts',
  edit_categories: 'admin.stock.permissionsPage.flagEditCategories',
  edit_suppliers: 'admin.stock.permissionsPage.flagEditSuppliers',
  manage_permissions: 'admin.stock.permissionsPage.flagManagePermissions',
  manage_calc_cards: 'admin.stock.permissionsPage.flagManageCalcCards',
  manage_settings: 'admin.stock.permissionsPage.flagManageSettings',
  view_other_balances: 'admin.stock.permissionsPage.flagViewOtherBalances',
  base_access: 'admin.stock.permissionsPage.flagBaseAccess',
  view_incoming: 'admin.stock.permissionsPage.flagViewIncoming',
  edit_incoming: 'admin.stock.permissionsPage.flagEditIncoming',
  view_return: 'admin.stock.permissionsPage.flagViewReturn',
  edit_return: 'admin.stock.permissionsPage.flagEditReturn',
  view_transfer: 'admin.stock.permissionsPage.flagViewTransfer',
  edit_transfer: 'admin.stock.permissionsPage.flagEditTransfer',
  view_writeoff: 'admin.stock.permissionsPage.flagViewWriteoff',
  create_writeoff: 'admin.stock.permissionsPage.flagCreateWriteoff',
  unpost_writeoff: 'admin.stock.permissionsPage.flagUnpostWriteoff',
  delete_draft_writeoff: 'admin.stock.permissionsPage.flagDeleteDraftWriteoff',
  view_audit: 'admin.stock.permissionsPage.flagViewAudit',
  post_audit: 'admin.stock.permissionsPage.flagPostAudit',
}

export default function AdminStockPermissionsPage() {
  const { t } = useTranslation()
  const { token: csrfToken } = useCSRF()
  const { confirm, confirmDialog } = useConfirm()
  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([])
  const [permissions, setPermissions] = useState<StockWarehousePermission[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editEntry, setEditEntry] = useState<{
    userId: string
    flags: WarehousePermissionFlags
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [whRes, permRes] = await Promise.all([
        fetch('/api/stock/warehouses'),
        selectedWarehouse
          ? fetch(`/api/stock/permissions?warehouseId=${selectedWarehouse}`)
          : fetch('/api/stock/permissions'),
      ])
      const [whJson, permJson] = await Promise.all([
        whRes.json(),
        permRes.json(),
      ])
      if (whJson.success) setWarehouses(whJson.data)
      if (permJson.success) setPermissions(permJson.data)
    } catch {
      setError(t('admin.stock.permissionsPage.errorLoad'))
    } finally {
      setLoading(false)
    }
  }, [selectedWarehouse, t])

  useEffect(() => {
    load()
  }, [load])

  async function savePermissions(
    userId: string,
    warehouseId: string,
    flags: WarehousePermissionFlags
  ) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/stock/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ userId, warehouseId, flags }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setEditEntry(null)
      load()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('admin.stock.permissionsPage.errorSave')
      )
    } finally {
      setSaving(false)
    }
  }

  async function removePermissions(userId: string, warehouseId: string) {
    if (
      !(await confirm({
        title: t('admin.stock.confirm.removePermissions.title'),
        description: t('admin.stock.confirm.removePermissions.description'),
        confirmLabel: t('admin.stock.confirm.removePermissions.action'),
        severity: 'significant',
      }))
    )
      return
    const res = await fetch(
      `/api/stock/permissions?userId=${userId}&warehouseId=${warehouseId}`,
      {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      }
    )
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
            {t('admin.stock.permissionsPage.title')}
          </h1>
        </div>

        <div className="mb-4">
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
          >
            <option value="">
              {t('admin.stock.permissionsPage.allWarehouses')}
            </option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>
                {wh.name_uk}
              </option>
            ))}
          </select>
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

        {!loading && permissions.length === 0 && (
          <p className="text-center text-dental-text py-12">
            {t('admin.stock.permissionsPage.noPermissions')}
          </p>
        )}

        {!loading && permissions.length > 0 && (
          <div className="space-y-2">
            {permissions.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                <div>
                  <p className="font-medium text-dental-dark text-sm">
                    {p.user_id}
                  </p>
                  <p className="text-xs text-dental-text">
                    {t(
                      'admin.stock.permissionsPage.warehousePermissionsSummary',
                      {
                        warehouseId: p.warehouse_id,
                        count: Object.values(p.flags).filter(Boolean).length,
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditEntry({ userId: p.user_id, flags: p.flags })
                    }
                    className="rounded px-3 py-1.5 text-xs border hover:bg-dental-secondary-50"
                  >
                    {t('admin.stock.permissionsPage.edit')}
                  </button>
                  <button
                    onClick={() => removePermissions(p.user_id, p.warehouse_id)}
                    className="rounded px-3 py-1.5 text-xs text-status-error-700 border border-dental-error/20 hover:bg-status-error-100"
                  >
                    {t('admin.stock.permissionsPage.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editEntry && selectedWarehouse && (
        <FlagsModal
          userId={editEntry.userId}
          warehouseId={selectedWarehouse}
          flags={editEntry.flags}
          saving={saving}
          onClose={() => setEditEntry(null)}
          onSave={savePermissions}
        />
      )}

      {confirmDialog}
    </>
  )
}

interface FlagsModalProps {
  userId: string
  warehouseId: string
  flags: WarehousePermissionFlags
  saving: boolean
  onClose: () => void
  onSave: (
    userId: string,
    warehouseId: string,
    flags: WarehousePermissionFlags
  ) => void
}

function FlagsModal({
  userId,
  warehouseId,
  flags,
  saving,
  onClose,
  onSave,
}: FlagsModalProps) {
  const { t } = useTranslation()
  const [localFlags, setLocalFlags] = useState<WarehousePermissionFlags>({
    ...flags,
  })

  function toggle(key: keyof WarehousePermissionFlags) {
    setLocalFlags(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-dental-dark mb-4">
          {t('admin.stock.permissionsPage.modalTitle')}
        </h2>
        <div className="space-y-2 mb-6">
          {(
            Object.entries(FLAG_LABEL_KEYS) as [
              keyof WarehousePermissionFlags,
              string,
            ][]
          ).map(([key, labelKey]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(localFlags[key])}
                onChange={() => toggle(key)}
                className="rounded"
              />
              <span className="text-sm text-dental-dark">{t(labelKey)}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
          >
            {t('admin.stock.permissionsPage.cancel')}
          </button>
          <button
            onClick={() => onSave(userId, warehouseId, localFlags)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('admin.stock.permissionsPage.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
