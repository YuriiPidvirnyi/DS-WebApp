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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:view')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { id } = await params

  const { data, error } = await auth.supabase
    .from('stock_documents')
    .select('*, items:stock_document_items(*)')
    .eq('id', id)
    .single()

  if (error || !data) return stockNotFound()

  return NextResponse.json({ success: true, data })
}

export async function PATCH(
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

  const { data: existing, error: fetchErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return stockNotFound()
  if (existing.status !== 'draft') return stockLocked()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.docDate === 'string') patch.doc_date = body.docDate
  if (typeof body.comment === 'string') patch.comment = body.comment || null
  if (body.supplierId !== undefined) patch.supplier_id = body.supplierId || null
  if (body.responsibleUserId !== undefined)
    patch.responsible_user_id = body.responsibleUserId || null
  if (body.imageUrl !== undefined) patch.image_url = body.imageUrl || null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('stock_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('[stock/documents/:id] PATCH error', {
      message: error.message,
    })
    captureException(new Error('[stock/documents/:id] PATCH failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити документ' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(
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

  const { data: existing, error: fetchErr } = await auth.supabase
    .from('stock_documents')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return stockNotFound()
  if (existing.status !== 'draft') return stockLocked()

  // Delete items first (cascade may handle this, but explicit for clarity)
  await auth.supabase
    .from('stock_document_items')
    .delete()
    .eq('stock_document_id', id)

  const { error } = await auth.supabase
    .from('stock_documents')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[stock/documents/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/documents/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити документ' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
