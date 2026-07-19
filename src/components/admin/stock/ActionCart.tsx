'use client'

import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { MaterialBalance } from '@/types/stock'

export type DrawerType = 'writeoff' | 'transfer' | 'requisition'

export interface CartItem {
  balance: MaterialBalance
  qty: number
}

export interface ActionCartHandle {
  addToCart: (type: DrawerType, balance: MaterialBalance) => void
}

interface Props {
  warehouseId: string
  csrfToken: string
  onDocPosted?: (docType: DrawerType) => void
}

const DRAWER_LABELS: Record<DrawerType, string> = {
  writeoff: 'admin.stock.actionCart.writeoff',
  transfer: 'admin.stock.actionCart.transfer',
  requisition: 'admin.stock.actionCart.requisition',
}

const ActionCart = forwardRef<ActionCartHandle, Props>(function ActionCart(
  { warehouseId, csrfToken, onDocPosted },
  ref
) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<DrawerType | null>(null)
  const [writeoffItems, setWriteoffItems] = useState<CartItem[]>([])
  const [transferItems, setTransferItems] = useState<CartItem[]>([])
  const [requisitionItems, setRequisitionItems] = useState<CartItem[]>([])
  const [toWarehouse, setToWarehouse] = useState<string>('')
  const [warehouses, setWarehouses] = useState<
    { id: string; name_uk: string }[]
  >([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stock/warehouses')
      .then(r => r.json())
      .then(j => {
        if (j.success)
          setWarehouses(
            j.data.filter((w: { id: string }) => w.id !== warehouseId)
          )
      })
  }, [warehouseId])

  useImperativeHandle(ref, () => ({
    addToCart(type: DrawerType, balance: MaterialBalance) {
      const setter =
        type === 'writeoff'
          ? setWriteoffItems
          : type === 'transfer'
            ? setTransferItems
            : setRequisitionItems
      setter(prev => {
        if (prev.find(i => i.balance.material_id === balance.material_id))
          return prev
        return [...prev, { balance, qty: 1 }]
      })
      setOpen(type)
    },
  }))

  function itemsForDrawer(type: DrawerType): CartItem[] {
    if (type === 'writeoff') return writeoffItems
    if (type === 'transfer') return transferItems
    return requisitionItems
  }

  function updateQty(type: DrawerType, materialId: string, qty: number) {
    const setter =
      type === 'writeoff'
        ? setWriteoffItems
        : type === 'transfer'
          ? setTransferItems
          : setRequisitionItems
    setter(prev =>
      prev.map(i => (i.balance.material_id === materialId ? { ...i, qty } : i))
    )
  }

  function removeFromCart(type: DrawerType, materialId: string) {
    const setter =
      type === 'writeoff'
        ? setWriteoffItems
        : type === 'transfer'
          ? setTransferItems
          : setRequisitionItems
    setter(prev => prev.filter(i => i.balance.material_id !== materialId))
  }

  async function handlePost(type: DrawerType) {
    const items = itemsForDrawer(type)
    if (items.length === 0) return
    setPosting(true)
    setError(null)
    try {
      const docType = type === 'transfer' ? 'transfer' : 'writeoff'

      const createRes = await fetch('/api/stock/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          docType,
          warehouseFrom: warehouseId,
          warehouseTo: type === 'transfer' ? toWarehouse || null : null,
        }),
      })
      const createJson = await createRes.json()
      if (!createJson.success) throw new Error(createJson.error)
      const docId = createJson.data.id

      for (const item of items) {
        await fetch(`/api/stock/documents/${docId}/add-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            materialId: item.balance.material_id,
            unitQty: item.qty,
          }),
        })
      }

      const postRes = await fetch(`/api/stock/documents/${docId}/post`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      })
      const postJson = await postRes.json()
      if (!postJson.success) throw new Error(postJson.error)

      const setter =
        type === 'writeoff'
          ? setWriteoffItems
          : type === 'transfer'
            ? setTransferItems
            : setRequisitionItems
      setter([])
      setOpen(null)
      onDocPosted?.(type)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('admin.stock.actionCart.postingError')
      )
    } finally {
      setPosting(false)
    }
  }

  const totalItems =
    writeoffItems.length + transferItems.length + requisitionItems.length
  if (totalItems === 0) return null

  return (
    <div className="fixed right-0 top-20 bottom-0 w-80 flex flex-col bg-white border-l border-dental-secondary-200 shadow-xl z-30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dental-secondary-200 bg-dental-secondary-50">
        <h3 className="font-semibold text-dental-dark text-sm">
          {t('admin.stock.actionCart.title')}
        </h3>
        <span className="rounded-full bg-dental-primary-600 text-white text-xs font-medium px-2 py-0.5">
          {totalItems}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(['writeoff', 'transfer', 'requisition'] as DrawerType[]).map(type => {
          const items = itemsForDrawer(type)
          if (items.length === 0) return null
          const isOpen = open === type

          return (
            <div key={type} className="border-b border-dental-secondary-100">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : type)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-dental-secondary-50 transition-colors"
              >
                <span className="text-sm font-medium text-dental-dark">
                  {t(DRAWER_LABELS[type])} ({items.length})
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-dental-text" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-dental-text" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {type === 'transfer' && (
                    <select
                      value={toWarehouse}
                      onChange={e => setToWarehouse(e.target.value)}
                      className="w-full rounded-lg border border-dental-secondary-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
                    >
                      <option value="">
                        {t(
                          'admin.stock.actionCart.destinationWarehousePlaceholder'
                        )}
                      </option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name_uk}
                        </option>
                      ))}
                    </select>
                  )}

                  {items.map(({ balance, qty }) => (
                    <div
                      key={balance.material_id}
                      className="flex items-center gap-2"
                    >
                      <p className="flex-1 text-xs text-dental-dark truncate">
                        {balance.material.name_uk}
                      </p>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={qty}
                        onChange={e =>
                          updateQty(
                            type,
                            balance.material_id,
                            Number(e.target.value)
                          )
                        }
                        className="w-16 rounded border border-dental-secondary-300 px-2 py-1 text-sm text-right focus:outline-hidden focus:ring-1 focus:ring-dental-primary-600"
                      />
                      <span className="text-xs text-dental-text w-8">
                        {balance.material.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(type, balance.material_id)
                        }
                      >
                        <X className="w-3.5 h-3.5 text-dental-text hover:text-dental-error" />
                      </button>
                    </div>
                  ))}

                  {error && (
                    <p className="text-xs text-status-error-700">{error}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePost(type)}
                    disabled={posting || (type === 'transfer' && !toWarehouse)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-dental-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-dental-dark disabled:opacity-60 transition-colors"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t('admin.stock.actionCart.post')} {t(DRAWER_LABELS[type])}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

ActionCart.displayName = 'ActionCart'

export default ActionCart
