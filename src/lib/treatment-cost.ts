/**
 * Single source of truth for treatment-record line items and the billed total.
 *
 * Shared by the API routes (POST/PATCH treatment-records) and the doctor
 * workstation UI, so the on-screen total and the persisted/billed total can't
 * drift. The clamping rule lives only here: a line is billed as `qty * price`
 * with `price >= 0` and `qty > 0` (finite); anything else contributes 0.
 */
export type ItemInput = {
  serviceId: string
  toothNumber?: string | null
  quantity?: number
  priceAtTime: number | string
}

export function isItemInput(x: unknown): x is ItemInput {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.serviceId === 'string' &&
    o.serviceId.length > 0 &&
    o.priceAtTime !== undefined &&
    (typeof o.priceAtTime === 'number' || typeof o.priceAtTime === 'string')
  )
}

export function computeTotalCost(items: ItemInput[]): number {
  return items.reduce((sum, item) => {
    const qty = item.quantity ?? 1
    const price = Number(item.priceAtTime)
    if (!Number.isFinite(price) || price < 0) return sum
    if (!Number.isFinite(qty) || qty <= 0) return sum
    return sum + qty * price
  }, 0)
}
