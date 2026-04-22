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
  if (typeof body.nameUk === 'string') patch.name_uk = body.nameUk.trim()
  if (typeof body.nameEn === 'string') patch.name_en = body.nameEn || null
  if (typeof body.namePl === 'string') patch.name_pl = body.namePl || null
  if (typeof body.color === 'string') patch.color = body.color || null
  if (typeof body.icon === 'string') patch.icon = body.icon || null
  if (body.parentId !== undefined) patch.parent_id = body.parentId || null
  if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder)
  if (body.isArchived === true || body.isArchived === false)
    patch.is_archived = body.isArchived

  // Prevent self-referencing parent
  if (patch.parent_id === id) {
    return NextResponse.json(
      { success: false, error: 'Категорія не може бути своїм батьком' },
      { status: 422 }
    )
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('material_categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') return stockNotFound()
    logger.error('[stock/categories/:id] PATCH error', {
      message: error?.message,
    })
    captureException(new Error('[stock/categories/:id] PATCH failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити категорію' },
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

  // Check if materials use this category
  const { count } = await auth.supabase
    .from('materials')
    .select('id', { count: 'exact', head: true })
    .eq('category_v2_id', id)

  if ((count ?? 0) > 0) {
    const { data, error } = await auth.supabase
      .from('material_categories')
      .update({ is_archived: true })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      logger.error('[stock/categories/:id] archive error', {
        message: error.message,
      })
      captureException(new Error('[stock/categories/:id] archive failed'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося архівувати категорію' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, archived: true, data })
  }

  const { error } = await auth.supabase
    .from('material_categories')
    .delete()
    .eq('id', id)
  if (error) {
    logger.error('[stock/categories/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/categories/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити категорію' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
