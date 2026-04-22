import { NextRequest, NextResponse } from 'next/server'
import {
  requireStockAdmin,
  isV2On,
  flagOff,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const { id, itemId } = await params

  const { data: doc, error: docErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status, doc_type')
    .eq('id', id)
    .single()

  if (docErr || !doc) {
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

  const { error } = await auth.supabase
    .from('stock_document_items')
    .delete()
    .eq('id', itemId)
    .eq('document_id', id)

  if (error) {
    logger.error('[stock/documents/:id/items/:itemId] DELETE error', {
      message: error.message,
    })
    captureException(
      new Error('[stock/documents/:id/items/:itemId] DELETE failed'),
      { supabaseError: error }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити позицію' },
      { status: 500 }
    )
  }

  // Recalculate document total
  const { data: items } = await auth.supabase
    .from('stock_document_items')
    .select('total_cost')
    .eq('document_id', id)

  const total = (items ?? []).reduce((sum, i) => sum + (i.total_cost ?? 0), 0)
  await auth.supabase
    .from('stock_documents')
    .update({ total_amount: total })
    .eq('id', id)

  return NextResponse.json({ success: true, deleted: true })
}
