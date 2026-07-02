import { NextRequest, NextResponse } from 'next/server'
import {
  requireStockAdmin,
  isV2On,
  flagOff,
  stockNotFound,
  stockLocked,
} from '@/lib/stock-helpers'
import { hasPermission } from '@/lib/permissions'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { logger } from '@/utils/logger'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:edit')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params

  const { data: doc, error: fetchErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status, doc_type')
    .eq('id', id)
    .single()

  if (fetchErr || !doc) return stockNotFound()
  if (doc.status !== 'draft') return stockLocked()

  let body: {
    items: Array<{
      materialId: string
      packQty: number
      unitQty: number
      unitCost: number
    }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json(
      { success: false, error: "items обов'язковий масив" },
      { status: 422 }
    )
  }

  for (const item of body.items) {
    if (
      !item.materialId ||
      typeof item.unitQty !== 'number' ||
      item.unitQty <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Кожен item повинен мати materialId та unitQty > 0',
        },
        { status: 422 }
      )
    }
  }

  // Replace all items atomically
  const { error: delErr } = await auth.supabase
    .from('stock_document_items')
    .delete()
    .eq('stock_document_id', id)

  if (delErr) {
    logger.error('[stock/documents/:id/items] DELETE existing error', {
      message: delErr.message,
    })
    captureException(
      new Error('[stock/documents/:id/items] items replace failed'),
      { supabaseError: delErr }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити позиції' },
      { status: 500 }
    )
  }

  if (body.items.length > 0) {
    const rows = body.items.map(item => ({
      stock_document_id: id,
      material_id: item.materialId,
      pack_qty: item.packQty ?? 0,
      unit_qty: item.unitQty,
      unit_cost: item.unitCost ?? 0,
      line_total: item.unitQty * (item.unitCost ?? 0),
    }))

    const { error: insErr } = await auth.supabase
      .from('stock_document_items')
      .insert(rows)

    if (insErr) {
      logger.error('[stock/documents/:id/items] INSERT error', {
        message: insErr.message,
      })
      captureException(
        new Error('[stock/documents/:id/items] items insert failed'),
        { supabaseError: insErr }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося зберегти позиції' },
        { status: 500 }
      )
    }
  }

  // Recalculate total_amount
  const totalAmount = body.items.reduce(
    (sum, i) => sum + i.unitQty * (i.unitCost ?? 0),
    0
  )
  await auth.supabase
    .from('stock_documents')
    .update({ total_amount: totalAmount })
    .eq('id', id)

  const { data: updated } = await auth.supabase
    .from('stock_documents')
    .select('*, items:stock_document_items(*)')
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, data: updated })
}
