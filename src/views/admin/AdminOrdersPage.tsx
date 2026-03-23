'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { useCSRF } from '@/hooks/useCSRF'
import { captureException } from '@/utils/sentry'
import { formatCurrency, formatDateTime } from './utils'

type OrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'delivered'
  | 'cancelled'
type Urgency = 'low' | 'normal' | 'high' | 'critical'
type MaterialOrder = {
  id: string
  status: OrderStatus
  total_estimated_cost: number
  notes: string | null
  urgency: Urgency
  created_at: string
  material_order_items: Array<{
    id: string
    quantity_requested: number
    unit_price: number
    materials: {
      name_uk: string | null
      name_en: string | null
      name_pl: string | null
    } | null
  }> | null
  admin_users: { display_name: string | null } | null
}
type LineDraft = {
  materialId: string
  quantityRequested: number
  unitPrice: number
}
type OrderItem = NonNullable<MaterialOrder['material_order_items']>[number]

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Чернетка',
  pending_approval: 'На затвердженні',
  approved: 'Затверджено',
  ordered: 'Замовлено',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
}
const ST_BADGE: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-sky-100 text-sky-800',
  ordered: 'bg-violet-100 text-violet-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}
const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Низька',
  normal: 'Звичайна',
  high: 'Висока',
  critical: 'Критична',
}
const URG_CLR: Record<Urgency, string> = {
  low: 'text-gray-600',
  normal: 'text-sky-700',
  high: 'text-orange-600',
  critical: 'text-red-600 font-semibold',
}
type PatchAct = {
  from: OrderStatus
  next: OrderStatus
  label: string
  cls?: string
}
const PATCH_ACTS: PatchAct[] = [
  {
    from: 'draft',
    next: 'pending_approval',
    label: 'Відправити на затвердження',
    cls: 'bg-amber-600 hover:bg-amber-700 text-white border-0 focus:ring-amber-500',
  },
  {
    from: 'pending_approval',
    next: 'approved',
    label: 'Затвердити',
    cls: 'bg-sky-600 hover:bg-sky-700 text-white border-0 focus:ring-sky-500',
  },
  { from: 'pending_approval', next: 'cancelled', label: 'Скасувати' },
  {
    from: 'approved',
    next: 'ordered',
    label: 'Замовлено',
    cls: 'bg-violet-600 hover:bg-violet-700 text-white border-0 focus:ring-violet-500',
  },
  {
    from: 'ordered',
    next: 'delivered',
    label: 'Доставлено',
    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white border-0 focus:ring-emerald-500',
  },
]
const mname = (m: OrderItem['materials']) =>
  !m ? '—' : m.name_uk?.trim() || m.name_en?.trim() || m.name_pl?.trim() || '—'
const grid =
  'grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border border-dental-secondary/60 rounded-lg p-3 bg-dental-primary/10'

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const { token: csrfToken, refreshToken } = useCSRF()
  const [orders, setOrders] = useState<MaterialOrder[]>([])
  const [materials, setMaterials] = useState<{ id: string; name_uk: string }[]>(
    []
  )
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [lines, setLines] = useState<LineDraft[]>([
    { materialId: '', quantityRequested: 1, unitPrice: 0 },
  ])
  const [notes, setNotes] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [saving, setSaving] = useState(false)
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const csrf = useCallback(
    () =>
      csrfToken ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('csrf_token') || refreshToken()
        : ''),
    [csrfToken, refreshToken]
  )
  const fail = useCallback(
    (e: unknown) => {
      captureException(e instanceof Error ? e : new Error(String(e)))
      setError(t('common.error'))
    },
    [t]
  )
  const loadOrders = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const q = statusFilter
          ? `?status=${encodeURIComponent(statusFilter)}`
          : ''
        const res = await fetch(`/api/material-orders${q}`)
        const json = (await res.json()) as {
          success?: boolean
          data?: MaterialOrder[]
          error?: string
        }
        if (!res.ok || !json.success)
          throw new Error(json.error || t('common.error'))
        setOrders(json.data ?? [])
      } catch (e) {
        fail(e)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [fail, statusFilter, t]
  )
  useEffect(() => {
    void loadOrders()
  }, [loadOrders])
  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch('/api/materials?isActive=true')
      const json = (await res.json()) as {
        success?: boolean
        data?: { id: string; name_uk: string }[]
      }
      if (!res.ok || !json.success) throw new Error('materials')
      setMaterials(json.data ?? [])
    } catch (e) {
      fail(e)
    }
  }, [fail])
  useEffect(() => {
    if (createOpen) void loadMaterials()
  }, [createOpen, loadMaterials])
  const setLine = (i: number, patch: Partial<LineDraft>) =>
    setLines(prev => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const submitCreate = async () => {
    const token = csrf()
    if (!token) return
    const payloadItems = lines
      .filter(l => l.materialId && l.quantityRequested > 0 && l.unitPrice >= 0)
      .map(l => ({
        materialId: l.materialId,
        quantityRequested: l.quantityRequested,
        unitPrice: l.unitPrice,
      }))
    if (!payloadItems.length) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/material-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({
          items: payloadItems,
          notes: notes.trim() || null,
          urgency,
        }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !json.success)
        throw new Error(json.error || t('common.error'))
      setCreateOpen(false)
      setLines([{ materialId: '', quantityRequested: 1, unitPrice: 0 }])
      setNotes('')
      setUrgency('normal')
      await loadOrders(true)
    } catch (e) {
      fail(e)
    } finally {
      setSaving(false)
    }
  }
  const patchStatus = async (id: string, status: OrderStatus) => {
    const token = csrf()
    if (!token) return
    setPatchingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/material-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ status }),
      })
      const json = (await res.json()) as {
        success?: boolean
        data?: MaterialOrder
        error?: string
      }
      if (!res.ok || !json.success)
        throw new Error(json.error || t('common.error'))
      if (json.data)
        setOrders(prev => prev.map(o => (o.id === id ? json.data! : o)))
      else await loadOrders(true)
    } catch (e) {
      fail(e)
    } finally {
      setPatchingId(null)
    }
  }
  const deleteDraft = async (id: string) => {
    if (!window.confirm('Видалити це замовлення-чернетку?')) return
    const token = csrf()
    if (!token) return
    setPatchingId(id)
    try {
      const res = await fetch(`/api/material-orders/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': token },
      })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !json.success)
        throw new Error(json.error || t('common.error'))
      setOrders(prev => prev.filter(o => o.id !== id))
      setExpandedId(e => (e === id ? null : e))
    } catch (e) {
      fail(e)
    } finally {
      setPatchingId(null)
    }
  }
  const stKeys = Object.keys(STATUS_LABELS) as OrderStatus[]
  const urgKeys = Object.keys(URGENCY_LABELS) as Urgency[]
  const tot = lines.reduce(
    (a, l) => a + Math.max(0, l.quantityRequested) * Math.max(0, l.unitPrice),
    0
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-dental-navy">
          Замовлення матеріалів
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-dental-text">
            Статус
            <Select
              selectSize="compact"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Фільтр за статусом замовлення"
            >
              <option value="">Усі</option>
              {stKeys.map(s => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadOrders(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Оновити
          </Button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-dental-teal hover:bg-dental-teal/90"
          >
            <Plus className="w-4 h-4" />
            Створити замовлення
          </Button>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-16 text-dental-text">
          <Loader2 className="w-8 h-8 animate-spin text-dental-teal" />
          <span className="ml-3">{t('common.loading')}</span>
        </div>
      ) : !orders.length ? (
        <div className="rounded-xl border border-dashed border-dental-secondary bg-white p-10 text-center text-dental-text">
          <Package className="w-10 h-10 mx-auto mb-3 text-dental-teal opacity-70" />
          Немає замовлень за обраним фільтром.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const items = order.material_order_items ?? []
            const ex = expandedId === order.id
            const busy = patchingId === order.id
            const flow = PATCH_ACTS.filter(a => a.from === order.status)
            return (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(ex ? null : order.id)}
                  className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-dental-primary/30"
                >
                  <span className="font-mono text-xs text-gray-500">
                    {order.id.slice(0, 8)}…
                  </span>
                  <span className="text-sm text-dental-text">
                    {formatDateTime(order.created_at)}
                  </span>
                  <span className="text-sm font-medium text-dental-navy">
                    {order.admin_users?.display_name?.trim() || '—'}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ST_BADGE[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className={`text-xs ${URG_CLR[order.urgency]}`}>
                    {URGENCY_LABELS[order.urgency]}
                  </span>
                  <span className="text-sm font-semibold text-dental-navy ml-auto">
                    {formatCurrency(order.total_estimated_cost)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {items.length} поз.
                  </span>
                  {ex ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {ex && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-dental-primary/20 space-y-3">
                    <div className="text-sm space-y-1">
                      {items.map(row => (
                        <div
                          key={row.id}
                          className="flex flex-wrap gap-2 justify-between border-b border-gray-100 py-2"
                        >
                          <span className="text-dental-navy font-medium">
                            {mname(row.materials)}
                          </span>
                          <span className="text-dental-text">
                            {row.quantity_requested} ×{' '}
                            {formatCurrency(row.unit_price)} ={' '}
                            {formatCurrency(
                              row.quantity_requested * row.unit_price
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-dental-text">
                        <span className="font-medium">Примітки:</span>{' '}
                        {order.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {flow.map(a => (
                        <Button
                          key={`${a.from}-${a.next}`}
                          type="button"
                          size="sm"
                          variant={a.cls ? 'ghost' : 'outline'}
                          disabled={busy}
                          onClick={() => void patchStatus(order.id, a.next)}
                          className={a.cls}
                        >
                          {a.label}
                        </Button>
                      ))}
                      {order.status === 'draft' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void deleteDraft(order.id)}
                          className="text-red-600 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1 inline" />
                          Видалити
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dental-navy/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-dental-navy">
                Створити замовлення
              </h2>
              <button
                type="button"
                onClick={() => !saving && setCreateOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {lines.map((line, i) => (
                <div key={i} className={grid}>
                  <label className="sm:col-span-5 block text-sm">
                    <span className="text-dental-text font-medium">
                      Матеріал
                    </span>
                    <Select
                      selectSize="compact"
                      fullWidth
                      className="mt-1"
                      value={line.materialId}
                      onChange={e => setLine(i, { materialId: e.target.value })}
                      aria-label="Матеріал"
                    >
                      <option value="">—</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name_uk}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="sm:col-span-3 block text-sm">
                    <span className="text-dental-text font-medium">
                      Кількість
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantityRequested}
                      onChange={e => {
                        const v = Number(e.target.value)
                        setLine(i, {
                          quantityRequested: Number.isNaN(v) ? 0 : v,
                        })
                      }}
                      className="mt-1"
                    />
                  </label>
                  <label className="sm:col-span-3 block text-sm">
                    <span className="text-dental-text font-medium">
                      Ціна за одиницю
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitPrice}
                      onChange={e => {
                        const v = Number(e.target.value)
                        setLine(i, { unitPrice: Number.isNaN(v) ? 0 : v })
                      }}
                      className="mt-1"
                    />
                  </label>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setLines(p =>
                          p.length <= 1 ? p : p.filter((_, j) => j !== i)
                        )
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Видалити рядок"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines(p => [
                    ...p,
                    { materialId: '', quantityRequested: 1, unitPrice: 0 },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-1 inline" />
                Додати позицію
              </Button>
              <label className="block text-sm">
                <span className="text-dental-text font-medium">
                  Терміновість
                </span>
                <Select
                  selectSize="compact"
                  fullWidth
                  className="mt-1"
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as Urgency)}
                  aria-label="Терміновість"
                >
                  {urgKeys.map(u => (
                    <option key={u} value={u}>
                      {URGENCY_LABELS[u]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="text-dental-text font-medium">Примітки</span>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </label>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-dental-navy font-semibold">
                  Загальна вартість: {formatCurrency(tot)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => !saving && setCreateOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void submitCreate()}
                    className="bg-dental-teal hover:bg-dental-teal/90"
                  >
                    {saving ? t('common.loading') : 'Зберегти'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
