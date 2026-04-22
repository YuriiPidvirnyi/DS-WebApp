import { NextRequest, NextResponse } from 'next/server'
import { requireStockAdmin, isV2On, flagOff } from '@/lib/stock-helpers'
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

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search')?.trim() || ''
  const categoryId = searchParams.get('categoryId')
  const brandId = searchParams.get('brandId')
  const supplierId = searchParams.get('supplierId')
  const includeArchived = searchParams.get('includeArchived') === 'true'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = 50
  const offset = (page - 1) * limit

  let query = auth.supabase
    .from('materials')
    .select('*', { count: 'exact' })
    .order('name_uk', { ascending: true })
    .range(offset, offset + limit - 1)

  if (!includeArchived) query = query.eq('is_active', true)
  if (search) query = query.ilike('name_uk', `%${search}%`)
  if (categoryId) query = query.eq('category_v2_id', categoryId)
  if (brandId) query = query.eq('brand_id', brandId)
  if (supplierId) query = query.eq('supplier_id', supplierId)

  const { data, error, count } = await query
  if (error) {
    logger.error('[stock/materials] GET error', { message: error.message })
    captureException(new Error('[stock/materials] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження матеріалів' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  })
}

export async function POST(request: NextRequest) {
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

  const nameUk = typeof body.nameUk === 'string' ? body.nameUk.trim() : ''
  if (!nameUk)
    return NextResponse.json(
      { success: false, error: "nameUk обов'язковий" },
      { status: 422 }
    )

  const unit = typeof body.unit === 'string' ? body.unit.trim() : 'шт'

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
  const packSizeUnit =
    typeof body.packSizeUnit === 'string' &&
    VALID_PACK_UNITS.includes(body.packSizeUnit)
      ? body.packSizeUnit
      : 'шт'

  const barcodes = Array.isArray(body.barcodes)
    ? (body.barcodes as unknown[]).filter(
        (b): b is string => typeof b === 'string' && b.trim() !== ''
      )
    : []

  const { data, error } = await auth.supabase
    .from('materials')
    .insert({
      name_uk: nameUk,
      name_en: (body.nameEn as string) || null,
      unit,
      category: (body.category as string) || null,
      brand_id: (body.brandId as string) || null,
      category_v2_id: (body.categoryId as string) || null,
      supplier_id: (body.supplierId as string) || null,
      barcode: (body.barcode as string) || null,
      sku: (body.sku as string) || null,
      pack_size: body.packSize ? Number(body.packSize) : 1,
      pack_unit: packSizeUnit,
      description_uk: (body.descriptionUk as string) || null,
      description_en: (body.descriptionEn as string) || null,
      pack_format_label: (body.packFormatLabel as string) || null,
      pack_size_numerator: body.packSizeNumerator
        ? Number(body.packSizeNumerator)
        : 1,
      pack_size_unit: packSizeUnit,
      barcodes,
      article_code: (body.articleCode as string) || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    logger.error('[stock/materials] POST error', { message: error.message })
    captureException(new Error('[stock/materials] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити матеріал' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
