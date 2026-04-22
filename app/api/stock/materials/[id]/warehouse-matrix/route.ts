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
    .from('material_inventory')
    .select(
      `
      material_id, warehouse_id,
      current_quantity,
      critical_level_unit_qty, default_reorder_unit_qty, is_visible,
      warehouse:stock_warehouses(id, name_uk, kind)
    `
    )
    .eq('material_id', id)
    .order('warehouse_id', { ascending: true })

  if (error) {
    logger.error('[stock/materials/:id/warehouse-matrix] GET error', {
      message: error.message,
    })
    captureException(
      new Error('[stock/materials/:id/warehouse-matrix] GET failed'),
      { supabaseError: error }
    )
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження матриці' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
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

  const warehouseId =
    typeof body.warehouseId === 'string' ? body.warehouseId : null
  if (!warehouseId) {
    return NextResponse.json(
      { success: false, error: "warehouseId обов'язковий" },
      { status: 422 }
    )
  }

  const patch: Record<string, unknown> = {}
  if (body.criticalLevelUnitQty !== undefined)
    patch.critical_level_unit_qty =
      body.criticalLevelUnitQty === null
        ? null
        : Number(body.criticalLevelUnitQty)
  if (body.defaultReorderUnitQty !== undefined)
    patch.default_reorder_unit_qty =
      body.defaultReorderUnitQty === null
        ? null
        : Number(body.defaultReorderUnitQty)
  if (body.isVisible !== undefined) patch.is_visible = Boolean(body.isVisible)

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('material_inventory')
    .update(patch)
    .eq('material_id', id)
    .eq('warehouse_id', warehouseId)
    .select()
    .maybeSingle()

  if (error) {
    logger.error('[stock/materials/:id/warehouse-matrix] PATCH error', {
      message: error.message,
    })
    captureException(
      new Error('[stock/materials/:id/warehouse-matrix] PATCH failed'),
      { supabaseError: error }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити матрицю' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
