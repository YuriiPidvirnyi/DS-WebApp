'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useCSRF } from '@/hooks/useCSRF'
import type {
  StockWarehousePermission,
  StockWarehouse,
  WarehousePermissionFlags,
} from '@/types/stock'

const FLAG_LABELS: Record<keyof WarehousePermissionFlags, string> = {
  manage_warehouses: 'Управління складами',
  edit_brands: 'Редагування брендів',
  edit_products: 'Редагування товарів',
  edit_categories: 'Редагування категорій',
  edit_suppliers: 'Редагування постачальників',
  manage_permissions: 'Управління правами',
  manage_calc_cards: 'Управління картами обліку',
  manage_settings: 'Налаштування модуля',
  view_other_balances: 'Перегляд чужих залишків',
  base_access: 'Базовий доступ',
  view_incoming: 'Перегляд приходів',
  edit_incoming: 'Редагування приходів',
  view_return: 'Перегляд повернень',
  edit_return: 'Редагування повернень',
  view_transfer: 'Перегляд переміщень',
  edit_transfer: 'Редагування переміщень',
  view_writeoff: 'Перегляд списань',
  create_writeoff: 'Створення списань',
  unpost_writeoff: 'Скасування списань',
  delete_draft_writeoff: 'Видалення чернеток списань',
  view_audit: 'Перегляд інвентаризацій',
  post_audit: 'Проведення інвентаризацій',
}

export default function AdminStockPermissionsPage() {
  const { token: csrfToken } = useCSRF()
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
      setError('Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [selectedWarehouse])

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
      setError(e instanceof Error ? e.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  async function removePermissions(userId: string, warehouseId: string) {
    if (!confirm('Видалити права?')) return
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/stock"
            className="text-dental-text hover:text-dental-primary-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-dental-dark font-nunito">
            Права доступу до складів
          </h1>
        </div>

        <div className="mb-4">
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-primary-600"
          >
            <option value="">Всі склади</option>
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
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && permissions.length === 0 && (
          <p className="text-center text-dental-text py-12">
            Права не встановлено
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
                    Склад: {p.warehouse_id} ·{' '}
                    {Object.values(p.flags).filter(Boolean).length} прав активно
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditEntry({ userId: p.user_id, flags: p.flags })
                    }
                    className="rounded px-3 py-1.5 text-xs border hover:bg-gray-50"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => removePermissions(p.user_id, p.warehouse_id)}
                    className="rounded px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Видалити
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
    </div>
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
          Права доступу
        </h2>
        <div className="space-y-2 mb-6">
          {(
            Object.entries(FLAG_LABELS) as [
              keyof WarehousePermissionFlags,
              string,
            ][]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(localFlags[key])}
                onChange={() => toggle(key)}
                className="rounded"
              />
              <span className="text-sm text-dental-dark">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dental-text hover:text-dental-dark"
          >
            Скасувати
          </button>
          <button
            onClick={() => onSave(userId, warehouseId, localFlags)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Зберегти
          </button>
        </div>
      </div>
    </div>
  )
}
