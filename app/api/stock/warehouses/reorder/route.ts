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

export async function PATCH(request: NextRequest) {
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

  let body: { order: Array<{ id: string; sortOrder: number }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json(
      { success: false, error: "order обов'язковий масив" },
      { status: 422 }
    )
  }

  for (const item of body.order) {
    if (typeof item.id !== 'string' || typeof item.sortOrder !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Кожен елемент повинен мати id та sortOrder' },
        { status: 422 }
      )
    }
  }

  const errors: string[] = []
  for (const item of body.order) {
    const { error } = await auth.supabase
      .from('stock_warehouses')
      .update({ sort_order: item.sortOrder })
      .eq('id', item.id)

    if (error) errors.push(item.id)
  }

  if (errors.length > 0) {
    logger.error('[stock/warehouses/reorder] PATCH partial error', {
      failed: errors,
    })
    captureException(
      new Error('[stock/warehouses/reorder] PATCH partial failure'),
      { failedIds: errors }
    )
    return NextResponse.json(
      {
        success: false,
        error: 'Деякі склади не вдалося оновити',
        failed: errors,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, updated: body.order.length })
}
