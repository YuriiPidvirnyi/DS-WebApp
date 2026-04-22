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
import type { WarehousePermissionFlags } from '@/types/stock'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_FLAGS = new Set<keyof WarehousePermissionFlags>([
  'manage_warehouses',
  'edit_brands',
  'edit_products',
  'edit_categories',
  'edit_suppliers',
  'manage_permissions',
  'manage_calc_cards',
  'manage_settings',
  'view_other_balances',
  'base_access',
  'view_incoming',
  'edit_incoming',
  'view_return',
  'edit_return',
  'view_transfer',
  'edit_transfer',
  'view_writeoff',
  'create_writeoff',
  'unpost_writeoff',
  'delete_draft_writeoff',
  'view_audit',
  'post_audit',
])

export async function GET(request: NextRequest) {
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

  const warehouseId = request.nextUrl.searchParams.get('warehouseId')
  const userId = request.nextUrl.searchParams.get('userId')

  let query = auth.supabase.from('stock_warehouse_permissions').select('*')

  if (warehouseId) query = query.eq('warehouse_id', warehouseId)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query

  if (error) {
    logger.error('[stock/permissions] GET error', { message: error.message })
    captureException(new Error('[stock/permissions] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження прав' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
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

  let body: {
    userId: string
    warehouseId: string
    flags: Record<string, boolean>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (!body.userId || !body.warehouseId) {
    return NextResponse.json(
      { success: false, error: "userId та warehouseId обов'язкові" },
      { status: 422 }
    )
  }

  if (!body.flags || typeof body.flags !== 'object') {
    return NextResponse.json(
      { success: false, error: "flags обов'язковий об'єкт" },
      { status: 422 }
    )
  }

  // Whitelist flag keys
  const sanitizedFlags: WarehousePermissionFlags = {}
  for (const [key, value] of Object.entries(body.flags)) {
    if (VALID_FLAGS.has(key as keyof WarehousePermissionFlags)) {
      sanitizedFlags[key as keyof WarehousePermissionFlags] = Boolean(value)
    }
  }

  const { data, error } = await auth.supabase
    .from('stock_warehouse_permissions')
    .upsert(
      {
        user_id: body.userId,
        warehouse_id: body.warehouseId,
        flags: sanitizedFlags,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,warehouse_id' }
    )
    .select()
    .single()

  if (error) {
    logger.error('[stock/permissions] POST error', { message: error.message })
    captureException(new Error('[stock/permissions] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося зберегти права' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
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

  const userId = request.nextUrl.searchParams.get('userId')
  const warehouseId = request.nextUrl.searchParams.get('warehouseId')

  if (!userId || !warehouseId) {
    return NextResponse.json(
      { success: false, error: "userId та warehouseId обов'язкові" },
      { status: 422 }
    )
  }

  const { error } = await auth.supabase
    .from('stock_warehouse_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('warehouse_id', warehouseId)

  if (error) {
    logger.error('[stock/permissions] DELETE error', { message: error.message })
    captureException(new Error('[stock/permissions] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити права' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
