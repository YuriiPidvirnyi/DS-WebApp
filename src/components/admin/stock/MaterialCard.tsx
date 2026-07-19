'use client'

import Image from 'next/image'
import {
  Package,
  ShoppingCart,
  ArrowLeftRight,
  MinusCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MaterialBalance, WarehouseKind } from '@/types/stock'

interface Props {
  balance: MaterialBalance
  onWriteoff?: (balance: MaterialBalance) => void
  onTransfer?: (balance: MaterialBalance) => void
  onRequisition?: (balance: MaterialBalance) => void
}

function qtyColour(
  qty: number,
  critical: number | null,
  kind: WarehouseKind
): string {
  if (qty <= 0) return 'text-status-error-700'
  if (critical != null && qty <= critical) return 'text-status-warning-700'
  return kind === 'main' ? 'text-status-success-700' : 'text-dental-primary-600'
}

export default function MaterialCard({
  balance,
  onWriteoff,
  onTransfer,
  onRequisition,
}: Props) {
  const { t } = useTranslation()
  const {
    material,
    warehouse,
    current_quantity: qty,
    critical_level_unit_qty: critical,
  } = balance

  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col gap-3 hover:shadow-xs transition-shadow">
      {/* Image + name */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dental-primary/10">
          {material.image_url ? (
            <Image
              src={material.image_url}
              alt=""
              width={32}
              height={32}
              className="rounded object-cover"
            />
          ) : (
            <Package className="w-5 h-5 text-dental-primary-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-dental-dark text-sm leading-tight truncate">
            {material.name_uk}
          </p>
          <p className="text-xs text-dental-text mt-0.5">
            {warehouse?.name_uk}
          </p>
        </div>
      </div>

      {/* Quantities */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs text-dental-text mb-0.5">
            {t('admin.stock.materialCard.inStock')}
          </p>
          <p
            className={`text-2xl font-semibold tabular-nums ${qtyColour(qty, critical, warehouse?.kind ?? 'other')}`}
          >
            {qty}
            <span className="text-sm font-normal ml-1">{material.unit}</span>
          </p>
        </div>
        {critical != null && (
          <div className="mb-1">
            <p className="text-xs text-dental-text">
              {t('admin.stock.materialCard.minLevel', { critical })}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-dental-secondary-100">
        <button
          type="button"
          onClick={() => onWriteoff?.(balance)}
          title={t('admin.stock.materialCard.writeoff')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dental-text/20 px-2 py-1.5 text-xs font-medium text-dental-text hover:bg-dental-secondary-50 transition-colors"
        >
          <MinusCircle className="w-3.5 h-3.5" />
          {t('admin.stock.materialCard.writeoff')}
        </button>
        <button
          type="button"
          onClick={() => onTransfer?.(balance)}
          title={t('admin.stock.materialCard.transfer')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dental-text/20 px-2 py-1.5 text-xs font-medium text-dental-text hover:bg-dental-secondary-50 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {t('admin.stock.materialCard.transfer')}
        </button>
        <button
          type="button"
          onClick={() => onRequisition?.(balance)}
          title={t('admin.stock.materialCard.requisition')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dental-text/20 px-2 py-1.5 text-xs font-medium text-dental-text hover:bg-dental-secondary-50 transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {t('admin.stock.materialCard.requisition')}
        </button>
      </div>
    </div>
  )
}
