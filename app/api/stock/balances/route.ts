import { NextRequest, NextResponse } from 'next/server'
import { requireStockAdmin, isV2On, flagOff } from '@/lib/stock-helpers'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { getCachedData } from '@/lib/redis'
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

  const sp = request.nextUrl.searchParams
  const warehouseId = sp.get('warehouseId')
  const categoryIds = sp.getAll('categoryIds')
  const criticalOnly = sp.get('criticalOnly') === 'true'
  const q = sp.get('q')?.trim() || ''
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 50)))
  const offset = (page - 1) * pageSize

  const cacheKey = `stock:balances:${warehouseId ?? 'all'}:${categoryIds.sort().join(',')}:${q}:${criticalOnly}:${page}`

  try {
    const data = await getCachedData(
      cacheKey,
      async () => {
        let query = auth.supabase
          .from('material_inventory')
          .select(
            `
            material_id, warehouse_id, current_quantity,
            critical_level_unit_qty, default_reorder_unit_qty, is_visible,
            material:materials!inner(
              id, name_uk, name_en, unit, image_url, is_active,
              category_v2_id, barcodes, article_code
            ),
            warehouse:stock_warehouses!inner(id, name_uk, kind)
          `,
            { count: 'exact' }
          )
          .eq('is_visible', true)
          .eq('material.is_active', true)
          .order('material_id', { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (warehouseId) query = query.eq('warehouse_id', warehouseId)
        if (categoryIds.length)
          query = query.in('material.category_v2_id', categoryIds)
        if (q) query = query.ilike('material.name_uk', `%${q}%`)
        if (criticalOnly) {
          // Only rows where qty <= critical threshold (or critical is set and qty == 0)
          query = query.or(
            'current_quantity.lte.critical_level_unit_qty,current_quantity.lte.0'
          )
        }

        const { data, error, count } = await query
        if (error) throw error
        return { rows: data ?? [], total: count ?? 0 }
      },
      30
    )

    return NextResponse.json({
      success: true,
      data: data.rows,
      meta: { total: data.total, page, pageSize },
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    logger.error('[stock/balances] GET error', { message: err.message })
    captureException(new Error('[stock/balances] GET failed'), {
      originalError: err,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження залишків' },
      { status: 500 }
    )
  }
}
