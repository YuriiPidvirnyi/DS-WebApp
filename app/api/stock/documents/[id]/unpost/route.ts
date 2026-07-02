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

  const { data: doc, error: fetchErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status, doc_type')
    .eq('id', id)
    .single()

  if (fetchErr || !doc) return stockNotFound()

  if (doc.status !== 'posted') {
    return NextResponse.json(
      { success: false, error: 'Документ не проведено' },
      { status: 409 }
    )
  }

  // Only writeoff can be unposted (ADR §5.3)
  if (doc.doc_type !== 'writeoff') {
    return NextResponse.json(
      {
        success: false,
        error: 'Скасування проведення доступне лише для списань',
      },
      { status: 422 }
    )
  }

  let body: { reason?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (reason.length < 3) {
    return NextResponse.json(
      { success: false, error: 'reason повинен мати мінімум 3 символи' },
      { status: 422 }
    )
  }

  const { data, error } = await auth.supabase.rpc('unpost_writeoff_document', {
    p_doc_id: id,
    p_reason: reason,
    p_actor_id: auth.user.id,
  })

  if (error) {
    logger.error('[stock/documents/:id/unpost] RPC error', {
      message: error.message,
    })
    captureException(
      new Error(
        '[stock/documents/:id/unpost] unpost_writeoff_document RPC failed'
      ),
      { supabaseError: error }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося скасувати проведення' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
