'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import { useConfirm } from '@/hooks/useConfirm'
import { useCSRF } from '@/hooks/useCSRF'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { can } from '@/lib/permissions'
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
  approved_by: string | null
  approved_at: string | null
  created_at: string
  ordered_by: string
  material_order_items: Array<{
    id: string
    quantity_requested: number
    quantity_delivered: number | null
    unit_price: number
    materials: {
      name_uk: string | null
      name_en: string | null
      name_pl: string | null
      image_url: string | null
    } | null
  }> | null
}
type AuditEntry = {
  id: string
  action: string
  before_data: { status?: string } | null
  after_data: { status?: string } | null
  changed_at: string
  admin_users: { display_name: string | null } | null
}
type LineDraft = {
  materialId: string
  quantityRequested: number
  unitPrice: number
}
type OrderItem = NonNullable<MaterialOrder['material_order_items']>[number]

const STATUS_I18N: Record<OrderStatus, string> = {
  draft: 'admin.ordersPage.statuses.draft',
  pending_approval: 'admin.ordersPage.statuses.pending_approval',
  approved: 'admin.ordersPage.statuses.approved',
  ordered: 'admin.ordersPage.statuses.ordered',
  delivered: 'admin.ordersPage.statuses.delivered',
  cancelled: 'admin.ordersPage.statuses.cancelled',
}
const ST_BADGE: Record<OrderStatus, string> = {
  draft: 'bg-dental-secondary-100 text-dental-text',
  pending_approval: 'bg-status-warning-100 text-status-warning-700',
  approved: 'bg-status-accent-100 text-status-accent-700',
  ordered: 'bg-status-accent-100 text-status-accent-700',
  delivered: 'bg-status-success-100 text-status-success-700',
  cancelled: 'bg-status-neutral-200 text-status-neutral-700',
}
const URGENCY_I18N: Record<Urgency, string> = {
  low: 'admin.ordersPage.urgency.low',
  normal: 'admin.ordersPage.urgency.normal',
  high: 'admin.ordersPage.urgency.high',
  critical: 'admin.ordersPage.urgency.critical',
}
const URG_CLR: Record<Urgency, string> = {
  low: 'text-dental-text',
  normal: 'text-dental-info-dark',
  high: 'text-status-warning-700',
  critical: 'text-status-error-700 font-semibold',
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
    label: 'admin.ordersPage.actions.sendForApproval',
    cls: 'bg-status-warning-700 hover:brightness-95 text-white border-0 focus:ring-dental-warning',
  },
  {
    from: 'pending_approval',
    next: 'approved',
    label: 'admin.ordersPage.actions.approve',
    cls: 'bg-dental-primary-600 hover:bg-dental-primary-700 text-white border-0 focus:ring-dental-primary-500',
  },
  {
    from: 'pending_approval',
    next: 'cancelled',
    label: 'admin.ordersPage.actions.cancel',
  },
  {
    from: 'approved',
    next: 'ordered',
    label: 'admin.ordersPage.actions.markOrdered',
    cls: 'bg-dental-primary-600 hover:bg-dental-primary-700 text-white border-0 focus:ring-dental-primary-500',
  },
  {
    from: 'approved',
    next: 'cancelled',
    label: 'admin.ordersPage.actions.cancel',
  },
  {
    from: 'ordered',
    next: 'delivered',
    label: 'admin.ordersPage.actions.markDelivered',
    cls: 'bg-dental-success-dark hover:brightness-95 text-white border-0 focus:ring-dental-success',
  },
  {
    from: 'ordered',
    next: 'cancelled',
    label: 'admin.ordersPage.actions.cancel',
  },
]
// Transitions the API gates behind orders:approve (must match APPROVAL_STATUSES
// in app/api/material-orders/[id]/route.ts). The UI hides these buttons for roles
// without the permission so they never click an action the API will 403.
const APPROVAL_STATUSES = new Set<OrderStatus>([
  'approved',
  'ordered',
  'delivered',
])
const mname = (m: OrderItem['materials']) =>
  !m ? '—' : m.name_uk?.trim() || m.name_en?.trim() || m.name_pl?.trim() || '—'
const grid =
  'grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border border-dental-secondary/60 rounded-lg p-3 bg-dental-primary/10'

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const { confirm, confirmDialog } = useConfirm()
  const { token: csrfToken, refreshToken } = useCSRF()
  const { user } = useAdminAuth()
  // RBAC-гейт дій (Р1): створювати може будь-який персонал, а видаляти
  // й затверджувати — лише відповідні ролі
  const canCreate = user ? can(user.role, 'orders:create') : false
  const canDelete = user ? can(user.role, 'orders:delete') : false
  const canApprove = user ? can(user.role, 'orders:approve') : false
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
  const [deliveryDraft, setDeliveryDraft] = useState<
    Record<string, Record<string, string>>
  >({})
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditEntry[]>>({})
  const [auditOpen, setAuditOpen] = useState<string | null>(null)
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
    if (
      !(await confirm({
        title: t('admin.ordersPage.deleteConfirm'),
        severity: 'irreversible',
        confirmLabel: t('common.delete'),
      }))
    )
      return
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
  const saveDeliveryQty = async (orderId: string) => {
    const token = csrf()
    if (!token) return
    const draft = deliveryDraft[orderId]
    if (!draft || !Object.keys(draft).length) return
    setSavingDelivery(true)
    setError(null)
    try {
      const items = Object.entries(draft).map(([itemId, val]) => ({
        id: itemId,
        quantityDelivered: Number(val) || 0,
      }))
      const res = await fetch(`/api/material-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ items }),
      })
      const json = (await res.json()) as {
        success?: boolean
        data?: MaterialOrder
        error?: string
      }
      if (!res.ok || !json.success)
        throw new Error(json.error || t('common.error'))
      if (json.data)
        setOrders(prev => prev.map(o => (o.id === orderId ? json.data! : o)))
      setDeliveryDraft(d => {
        const n = { ...d }
        delete n[orderId]
        return n
      })
    } catch (e) {
      fail(e)
    } finally {
      setSavingDelivery(false)
    }
  }

  const loadAuditLog = async (orderId: string) => {
    if (auditOpen === orderId) {
      setAuditOpen(null)
      return
    }
    setAuditOpen(orderId)
    if (auditLogs[orderId]) return
    try {
      const res = await fetch(
        `/api/admin/audit-logs?table=material_orders&recordId=${orderId}`
      )
      const json = (await res.json()) as {
        success?: boolean
        data?: AuditEntry[]
      }
      if (json.success && json.data) {
        setAuditLogs(prev => ({ ...prev, [orderId]: json.data! }))
      }
    } catch {
      // silent — audit is non-critical
    }
  }

  const stKeys = Object.keys(STATUS_I18N) as OrderStatus[]
  const urgKeys = Object.keys(URGENCY_I18N) as Urgency[]
  const tot = lines.reduce(
    (a, l) => a + Math.max(0, l.quantityRequested) * Math.max(0, l.unitPrice),
    0
  )
  return (
    <div className="space-y-6">
      {confirmDialog}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-dental-navy">
          {t('admin.ordersPage.title')}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-dental-text">
            {t('admin.ordersPage.statusFilter')}
            <Select
              selectSize="compact"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label={t('admin.ordersPage.statusFilter')}
            >
              <option value="">{t('admin.ordersPage.allStatuses')}</option>
              {stKeys.map(s => (
                <option key={s} value={s}>
                  {t(STATUS_I18N[s])}
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
            {t('admin.ordersPage.refresh')}
          </Button>
          {canCreate && (
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="gap-2 bg-dental-teal hover:bg-dental-teal/90"
            >
              <Plus className="w-4 h-4" />
              {t('admin.ordersPage.createOrder')}
            </Button>
          )}
        </div>
      </div>
      {error && <ErrorState title={error} onRetry={() => void loadOrders()} />}
      {loading ? (
        <div className="flex justify-center py-16 text-dental-text">
          <Loader2 className="w-8 h-8 animate-spin text-dental-teal" />
          <span className="ml-3">{t('common.loading')}</span>
        </div>
      ) : !orders.length ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title={t('admin.ordersPage.empty')}
        />
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
                className="rounded-xl border border-dental-secondary-200 bg-white shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(ex ? null : order.id)}
                  className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-dental-primary/30"
                >
                  <span className="font-mono text-xs text-dental-muted">
                    {order.id.slice(0, 8)}…
                  </span>
                  <span className="text-sm text-dental-text">
                    {formatDateTime(order.created_at)}
                  </span>
                  <span className="text-sm font-medium text-dental-navy">
                    —
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ST_BADGE[order.status]}`}
                  >
                    {t(STATUS_I18N[order.status])}
                  </span>
                  <span className={`text-xs ${URG_CLR[order.urgency]}`}>
                    {t(URGENCY_I18N[order.urgency])}
                  </span>
                  <span className="text-sm font-semibold text-dental-navy ml-auto">
                    {formatCurrency(order.total_estimated_cost)}
                  </span>
                  <span className="text-xs text-dental-muted">
                    {items.length} {t('admin.ordersPage.items')}
                  </span>
                  {ex ? (
                    <ChevronUp className="w-5 h-5 text-dental-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dental-muted" />
                  )}
                </button>
                {ex && (
                  <div className="border-t border-dental-secondary-100 px-4 py-4 bg-dental-primary/20 space-y-3">
                    <div className="text-sm space-y-1">
                      {items.map(row => {
                        const deliv = Number(row.quantity_delivered || 0)
                        const req = Number(row.quantity_requested)
                        const pct =
                          req > 0 ? Math.min(100, (deliv / req) * 100) : 0
                        const showDelivery =
                          order.status === 'ordered' ||
                          order.status === 'delivered'
                        return (
                          <div
                            key={row.id}
                            className="border-b border-dental-secondary-100 py-2 space-y-1"
                          >
                            <div className="flex flex-wrap gap-2 justify-between items-center">
                              <span className="inline-flex items-center gap-2 text-dental-navy font-medium">
                                {row.materials?.image_url ? (
                                  <Image
                                    src={row.materials.image_url}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 rounded object-cover"
                                  />
                                ) : null}
                                {mname(row.materials)}
                              </span>
                              <span className="text-dental-text">
                                {req} × {formatCurrency(row.unit_price)} ={' '}
                                {formatCurrency(req * row.unit_price)}
                              </span>
                            </div>
                            {showDelivery && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="h-1.5 rounded-full bg-dental-secondary-200 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-dental-success transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                {order.status === 'ordered' ? (
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-dental-text">
                                      {t('admin.ordersPage.delivery.received')}:
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={req}
                                      className="w-16 rounded border border-dental-secondary-200 px-1.5 py-0.5 text-xs text-dental-dark"
                                      value={
                                        deliveryDraft[order.id]?.[row.id] ??
                                        String(deliv)
                                      }
                                      onChange={e =>
                                        setDeliveryDraft(d => ({
                                          ...d,
                                          [order.id]: {
                                            ...d[order.id],
                                            [row.id]: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                    <span className="text-dental-muted">
                                      / {req}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-dental-text">
                                    {deliv} / {req}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-dental-text">
                        <span className="font-medium">
                          {t('admin.ordersPage.notes')}:
                        </span>{' '}
                        {order.notes}
                      </p>
                    )}
                    {order.approved_at && (
                      <p className="text-xs text-dental-muted">
                        {t('admin.ordersPage.approvedAt')}:{' '}
                        {formatDateTime(order.approved_at)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'ordered' &&
                        deliveryDraft[order.id] &&
                        Object.keys(deliveryDraft[order.id]).length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={savingDelivery}
                            onClick={() => void saveDeliveryQty(order.id)}
                            className="gap-1 border-dental-success/30 text-status-success-700"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingDelivery
                              ? '...'
                              : t('admin.ordersPage.delivery.save')}
                          </Button>
                        )}
                      {flow
                        .filter(
                          a => !APPROVAL_STATUSES.has(a.next) || canApprove
                        )
                        .map(a => (
                          <Button
                            key={`${a.from}-${a.next}`}
                            type="button"
                            size="sm"
                            variant={a.cls ? 'ghost' : 'outline'}
                            disabled={busy}
                            onClick={() => void patchStatus(order.id, a.next)}
                            className={a.cls}
                          >
                            {t(a.label)}
                          </Button>
                        ))}
                      {order.status === 'draft' && canDelete && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void deleteDraft(order.id)}
                          className="text-status-error-700 border-dental-error/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1 inline" />
                          {t('admin.ordersPage.actions.delete')}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void loadAuditLog(order.id)}
                        className="gap-1 ml-auto text-dental-text"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {t('admin.ordersPage.history')}
                      </Button>
                    </div>
                    {/* Audit history timeline */}
                    {auditOpen === order.id && (
                      <div className="rounded-lg border border-dental-secondary-200 bg-white p-3 text-xs space-y-2">
                        <p className="font-medium text-dental-navy text-sm">
                          {t('admin.ordersPage.historyTitle')}
                        </p>
                        {!auditLogs[order.id]?.length ? (
                          <p className="text-dental-muted">
                            {t('admin.ordersPage.noHistory')}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {auditLogs[order.id].map(log => (
                              <div
                                key={log.id}
                                className="flex items-start gap-2"
                              >
                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-dental-teal" />
                                <div>
                                  <span className="text-dental-muted">
                                    {formatDateTime(log.changed_at)}
                                  </span>
                                  {' — '}
                                  <span className="font-medium text-dental-dark">
                                    {log.admin_users?.display_name || '—'}
                                  </span>
                                  {log.before_data?.status &&
                                    log.after_data?.status && (
                                      <>
                                        {': '}
                                        <span
                                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${ST_BADGE[log.before_data.status as OrderStatus] || 'bg-dental-secondary-100'}`}
                                        >
                                          {t(
                                            STATUS_I18N[
                                              log.before_data
                                                .status as OrderStatus
                                            ] || log.before_data.status
                                          )}
                                        </span>
                                        {' → '}
                                        <span
                                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${ST_BADGE[log.after_data.status as OrderStatus] || 'bg-dental-secondary-100'}`}
                                        >
                                          {t(
                                            STATUS_I18N[
                                              log.after_data
                                                .status as OrderStatus
                                            ] || log.after_data.status
                                          )}
                                        </span>
                                      </>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dental-navy/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dental-secondary-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dental-secondary-100">
              <h2 className="text-lg font-semibold text-dental-navy">
                {t('admin.ordersPage.create.title')}
              </h2>
              <button
                type="button"
                onClick={() => !saving && setCreateOpen(false)}
                className="p-2 rounded-lg hover:bg-dental-secondary-100"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {lines.map((line, i) => (
                <div key={i} className={grid}>
                  <label className="sm:col-span-5 block text-sm">
                    <span className="text-dental-text font-medium">
                      {t('admin.ordersPage.create.material')}
                    </span>
                    <Select
                      selectSize="compact"
                      fullWidth
                      className="mt-1"
                      value={line.materialId}
                      onChange={e => setLine(i, { materialId: e.target.value })}
                      aria-label={t('admin.ordersPage.create.material')}
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
                      {t('admin.ordersPage.create.quantity')}
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
                      {t('admin.ordersPage.create.unitPrice')}
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
                      className="p-2 text-dental-error hover:bg-status-error-100 rounded-lg"
                      aria-label={t('common.delete')}
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
                {t('admin.ordersPage.create.addItem')}
              </Button>
              <label className="block text-sm">
                <span className="text-dental-text font-medium">
                  {t('admin.ordersPage.create.urgency')}
                </span>
                <Select
                  selectSize="compact"
                  fullWidth
                  className="mt-1"
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as Urgency)}
                  aria-label={t('admin.ordersPage.create.urgency')}
                >
                  {urgKeys.map(u => (
                    <option key={u} value={u}>
                      {t(URGENCY_I18N[u])}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm">
                <span className="text-dental-text font-medium">
                  {t('admin.ordersPage.create.notes')}
                </span>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </label>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-dental-navy font-semibold">
                  {t('admin.ordersPage.create.totalCost')}:{' '}
                  {formatCurrency(tot)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => !saving && setCreateOpen(false)}
                  >
                    {t('admin.ordersPage.create.cancel')}
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void submitCreate()}
                    className="bg-dental-teal hover:bg-dental-teal/90"
                  >
                    {saving
                      ? t('common.loading')
                      : t('admin.ordersPage.create.save')}
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
