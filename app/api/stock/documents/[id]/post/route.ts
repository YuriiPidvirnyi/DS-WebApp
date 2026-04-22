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
  if (doc.status !== 'draft') return stockLocked()

  // Validate at least one item exists
  const { count, error: countErr } = await auth.supabase
    .from('stock_document_items')
    .select('id', { count: 'exact', head: true })
    .eq('stock_document_id', id)

  if (countErr) {
    logger.error('[stock/documents/:id/post] item count error', {
      message: countErr.message,
    })
    captureException(
      new Error('[stock/documents/:id/post] item count failed'),
      { supabaseError: countErr }
    )
    return NextResponse.json(
      { success: false, error: 'Помилка перевірки позицій' },
      { status: 500 }
    )
  }

  if ((count ?? 0) === 0) {
    return NextResponse.json(
      { success: false, error: 'Документ не має позицій' },
      { status: 422 }
    )
  }

  const { data, error } = await auth.supabase.rpc('post_stock_document', {
    p_doc_id: id,
    p_posted_by: auth.user.id,
  })

  if (error) {
    logger.error('[stock/documents/:id/post] RPC error', {
      message: error.message,
    })
    captureException(
      new Error('[stock/documents/:id/post] post_stock_document RPC failed'),
      { supabaseError: error }
    )

    if (error.message?.includes('negative_balance')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Недостатньо залишків',
          code: 'NEGATIVE_BALANCE',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Не вдалося провести документ' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
