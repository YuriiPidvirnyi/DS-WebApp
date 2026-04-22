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

const VALID_KINDS = new Set(['main', 'cabinet', 'doctor', 'other'])

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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const { id } = await params

  // Fetch existing warehouse
  const { data: existing, error: fetchErr } = await auth.supabase
    .from('stock_warehouses')
    .select('id, kind, is_archived')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return stockNotFound()

  // If archiving, check for existing documents (ADR §13.7)
  const isArchiving = body.isArchived === true && !existing.is_archived
  if (isArchiving) {
    const { count, error: countErr } = await auth.supabase
      .from('stock_documents')
      .select('id', { count: 'exact', head: true })
      .or(`warehouse_from_id.eq.${id},warehouse_to_id.eq.${id}`)

    if (countErr) {
      logger.error('[stock/warehouses/:id] archive check error', {
        message: countErr.message,
      })
      captureException(
        new Error('[stock/warehouses/:id] PATCH archive check failed'),
        { supabaseError: countErr }
      )
      return NextResponse.json(
        { success: false, error: 'Помилка перевірки документів' },
        { status: 500 }
      )
    }

    if ((count ?? 0) > 0) {
      return stockLocked()
    }
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.nameUk === 'string') patch.name_uk = body.nameUk.trim()
  if (typeof body.nameEn === 'string') patch.name_en = body.nameEn || null
  if (typeof body.namePl === 'string') patch.name_pl = body.namePl || null
  if (typeof body.comment === 'string') patch.comment = body.comment || null
  if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder)
  if (body.responsibleUserId !== undefined)
    patch.responsible_user_id = body.responsibleUserId || null
  if (body.doctorId !== undefined) patch.doctor_id = body.doctorId || null
  if (body.isArchived === true || body.isArchived === false)
    patch.is_archived = body.isArchived

  if (typeof body.kind === 'string') {
    if (!VALID_KINDS.has(body.kind)) {
      return NextResponse.json(
        { success: false, error: 'Невалідний kind' },
        { status: 422 }
      )
    }
    patch.kind = body.kind
    patch.is_main = body.kind === 'main'
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('stock_warehouses')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('[stock/warehouses/:id] PATCH error', {
      message: error.message,
    })
    captureException(new Error('[stock/warehouses/:id] PATCH failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити склад' },
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
    .from('stock_warehouses')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return stockNotFound()

  // Never hard-delete — check for any documents (ADR §13.7)
  const { count, error: countErr } = await auth.supabase
    .from('stock_documents')
    .select('id', { count: 'exact', head: true })
    .or(`warehouse_from_id.eq.${id},warehouse_to_id.eq.${id}`)

  if (countErr) {
    logger.error('[stock/warehouses/:id] DELETE doc check error', {
      message: countErr.message,
    })
    captureException(
      new Error('[stock/warehouses/:id] DELETE doc check failed'),
      { supabaseError: countErr }
    )
    return NextResponse.json(
      { success: false, error: 'Помилка перевірки документів' },
      { status: 500 }
    )
  }

  if ((count ?? 0) > 0) {
    // Soft-delete (archive) instead
    const { data, error } = await auth.supabase
      .from('stock_warehouses')
      .update({ is_archived: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[stock/warehouses/:id] archive fallback error', {
        message: error.message,
      })
      captureException(
        new Error('[stock/warehouses/:id] archive fallback failed'),
        { supabaseError: error }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося архівувати склад' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, archived: true, data })
  }

  // Hard delete only when zero documents
  const { error } = await auth.supabase
    .from('stock_warehouses')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[stock/warehouses/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/warehouses/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити склад' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
