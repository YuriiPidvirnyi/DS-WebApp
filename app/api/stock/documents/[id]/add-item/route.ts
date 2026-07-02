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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const { id } = await params

  // Load document to check status + type
  const { data: doc, error: docErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status, doc_type')
    .eq('id', id)
    .single()

  if (docErr || !doc) {
    if (docErr?.code === 'PGRST116') return stockNotFound()
    return NextResponse.json(
      { success: false, error: 'Документ не знайдено' },
      { status: 404 }
    )
  }

  if (doc.status !== 'draft') return stockLocked()

  if (!hasPermission(auth.access.role, 'inventory:edit')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const materialId =
    typeof body.materialId === 'string' ? body.materialId : null
  if (!materialId) {
    return NextResponse.json(
      { success: false, error: "materialId обов'язковий" },
      { status: 422 }
    )
  }

  const unitQty =
    typeof body.unitQty === 'number' ? body.unitQty : Number(body.unitQty ?? 1)
  const packQty =
    typeof body.packQty === 'number'
      ? body.packQty
      : body.packQty
        ? Number(body.packQty)
        : null
  const unitCost =
    typeof body.unitCost === 'number'
      ? body.unitCost
      : body.unitCost
        ? Number(body.unitCost)
        : null

  if (unitQty <= 0) {
    return NextResponse.json(
      { success: false, error: 'unitQty має бути > 0' },
      { status: 422 }
    )
  }

  const { data: item, error: itemErr } = await auth.supabase
    .from('stock_document_items')
    .insert({
      document_id: id,
      material_id: materialId,
      unit_qty: unitQty,
      pack_qty: packQty,
      unit_cost: unitCost,
      total_cost: unitCost != null ? unitCost * unitQty : null,
    })
    .select()
    .single()

  if (itemErr) {
    logger.error('[stock/documents/:id/add-item] POST error', {
      message: itemErr.message,
    })
    captureException(new Error('[stock/documents/:id/add-item] POST failed'), {
      supabaseError: itemErr,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося додати позицію' },
      { status: 500 }
    )
  }

  // Recalculate total_amount on document
  const { data: items } = await auth.supabase
    .from('stock_document_items')
    .select('total_cost')
    .eq('document_id', id)

  const total = (items ?? []).reduce((sum, i) => sum + (i.total_cost ?? 0), 0)
  await auth.supabase
    .from('stock_documents')
    .update({ total_amount: total })
    .eq('id', id)

  return NextResponse.json({ success: true, data: item }, { status: 201 })
}
