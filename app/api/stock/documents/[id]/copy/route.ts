import { NextRequest, NextResponse } from 'next/server'
import {
  requireStockAdmin,
  isV2On,
  flagOff,
  stockNotFound,
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
  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
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

  const { data: source, error: fetchErr } = await auth.supabase
    .from('stock_documents')
    .select('*, items:stock_document_items(*)')
    .eq('id', id)
    .single()

  if (fetchErr || !source) return stockNotFound()

  // Generate new doc number
  const { data: newNumber, error: numErr } = await auth.supabase.rpc(
    'next_doc_number',
    { p_doc_type: source.doc_type }
  )

  if (numErr || !newNumber) {
    logger.error('[stock/documents/:id/copy] next_doc_number error', {
      message: numErr?.message,
    })
    captureException(
      new Error('[stock/documents/:id/copy] next_doc_number failed'),
      { supabaseError: numErr }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося згенерувати номер' },
      { status: 500 }
    )
  }

  const { data: newDoc, error: docErr } = await auth.supabase
    .from('stock_documents')
    .insert({
      doc_type: source.doc_type,
      doc_number: newNumber,
      status: 'draft',
      doc_date: new Date().toISOString().slice(0, 10),
      warehouse_from_id: source.warehouse_from_id,
      warehouse_to_id: source.warehouse_to_id,
      supplier_id: source.supplier_id,
      responsible_user_id: auth.user.id,
      comment: source.comment ? `Копія ${source.doc_number}` : null,
      total_amount: source.total_amount,
    })
    .select()
    .single()

  if (docErr || !newDoc) {
    logger.error('[stock/documents/:id/copy] doc insert error', {
      message: docErr?.message,
    })
    captureException(
      new Error('[stock/documents/:id/copy] doc insert failed'),
      { supabaseError: docErr }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося скопіювати документ' },
      { status: 500 }
    )
  }

  if (source.items?.length > 0) {
    const itemRows = source.items.map((item: Record<string, unknown>) => ({
      stock_document_id: newDoc.id,
      material_id: item.material_id,
      pack_qty: item.pack_qty,
      unit_qty: item.unit_qty,
      unit_cost: item.unit_cost,
      line_total: item.line_total,
    }))

    const { error: itemErr } = await auth.supabase
      .from('stock_document_items')
      .insert(itemRows)

    if (itemErr) {
      logger.error('[stock/documents/:id/copy] items insert error', {
        message: itemErr.message,
      })
      captureException(
        new Error('[stock/documents/:id/copy] items insert failed'),
        { supabaseError: itemErr }
      )
      // Return the empty doc anyway — user can re-add items
    }
  }

  const { data: result } = await auth.supabase
    .from('stock_documents')
    .select('*, items:stock_document_items(*)')
    .eq('id', newDoc.id)
    .single()

  return NextResponse.json({ success: true, data: result }, { status: 201 })
}
