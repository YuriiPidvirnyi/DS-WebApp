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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const { id } = await params

  const { data, error } = await auth.supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') return stockNotFound()
    logger.error('[stock/materials/:id] GET error', { message: error?.message })
    captureException(new Error('[stock/materials/:id] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження матеріалу' },
      { status: 500 }
    )
  }

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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const VALID_PACK_UNITS = [
    'шт',
    'г',
    'кг',
    'мл',
    'л',
    'см',
    'м',
    'пара',
    'набір',
  ]

  const patch: Record<string, unknown> = {}
  if (typeof body.nameUk === 'string') patch.name_uk = body.nameUk.trim()
  if (typeof body.nameEn === 'string') patch.name_en = body.nameEn || null
  if (typeof body.unit === 'string') patch.unit = body.unit.trim()
  if (typeof body.category === 'string') patch.category = body.category || null
  if (body.brandId !== undefined)
    patch.brand_id = (body.brandId as string) || null
  if (body.categoryId !== undefined)
    patch.category_v2_id = (body.categoryId as string) || null
  if (body.supplierId !== undefined)
    patch.supplier_id = (body.supplierId as string) || null
  if (typeof body.barcode === 'string') patch.barcode = body.barcode || null
  if (typeof body.sku === 'string') patch.sku = body.sku || null
  if (body.packSize !== undefined)
    patch.pack_size = body.packSize ? Number(body.packSize) : null
  if (typeof body.descriptionUk === 'string')
    patch.description_uk = body.descriptionUk || null
  if (typeof body.descriptionEn === 'string')
    patch.description_en = body.descriptionEn || null
  if (typeof body.packFormatLabel === 'string')
    patch.pack_format_label = body.packFormatLabel || null
  if (body.packSizeNumerator !== undefined)
    patch.pack_size_numerator = Number(body.packSizeNumerator) || 1
  if (
    typeof body.packSizeUnit === 'string' &&
    VALID_PACK_UNITS.includes(body.packSizeUnit)
  ) {
    patch.pack_size_unit = body.packSizeUnit
    patch.pack_unit = body.packSizeUnit
  }
  if (Array.isArray(body.barcodes)) {
    patch.barcodes = (body.barcodes as unknown[]).filter(
      (b): b is string => typeof b === 'string' && b.trim() !== ''
    )
  }
  if (typeof body.articleCode === 'string')
    patch.article_code = body.articleCode || null
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive)

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('materials')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') return stockNotFound()
    logger.error('[stock/materials/:id] PATCH error', {
      message: error?.message,
    })
    captureException(new Error('[stock/materials/:id] PATCH failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити матеріал' },
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

  // Archive if referenced in any document items
  const { count } = await auth.supabase
    .from('stock_document_items')
    .select('id', { count: 'exact', head: true })
    .eq('material_id', id)

  if ((count ?? 0) > 0) {
    const { data, error } = await auth.supabase
      .from('materials')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      logger.error('[stock/materials/:id] archive error', {
        message: error.message,
      })
      captureException(new Error('[stock/materials/:id] archive failed'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося архівувати матеріал' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, archived: true, data })
  }

  const { error } = await auth.supabase.from('materials').delete().eq('id', id)
  if (error) {
    logger.error('[stock/materials/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/materials/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити матеріал' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
