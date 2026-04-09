import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CSRF validation is not required for GET — idempotent read, no state mutation.
/** GET /api/admin/inventory-analytics?period=30|90|365 */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const access = await getAdminAccess(supabase, user.id)
  if (!access || !hasPermission(access.role, 'analytics:view')) {
    return NextResponse.json(
      { success: false, error: 'Недостатньо прав' },
      { status: 403 }
    )
  }

  const { searchParams } = request.nextUrl
  const period = Number(searchParams.get('period') || 30)
  const since = new Date()
  since.setDate(since.getDate() - period)
  const sinceISO = since.toISOString()

  try {
    // 1. Stock summary: total materials, low stock count
    const { data: materials } = await supabase
      .from('materials')
      .select(
        'id, name_uk, category, min_stock_level, is_active, material_inventory(current_quantity)'
      )
      .eq('is_active', true)

    const totalMaterials = materials?.length ?? 0
    let lowStockCount = 0
    const stockLevels: Array<{
      name: string
      category: string
      current: number
      min: number
    }> = []

    for (const mat of materials ?? []) {
      const inv = mat.material_inventory as Array<{
        current_quantity: number | string
      }> | null
      const total = (inv ?? []).reduce(
        (acc: number, r: { current_quantity: number | string }) =>
          acc + Number(r.current_quantity || 0),
        0
      )
      if (total < Number(mat.min_stock_level)) lowStockCount++
      stockLevels.push({
        name: mat.name_uk,
        category: mat.category,
        current: total,
        min: Number(mat.min_stock_level),
      })
    }

    // 2. Spending by category (from delivered orders in period)
    const { data: deliveredOrders } = await supabase
      .from('material_orders')
      .select(
        'total_estimated_cost, material_order_items(unit_price, quantity_delivered, quantity_requested, materials(category, name_uk))'
      )
      .eq('status', 'delivered')
      .gte('created_at', sinceISO)

    const spendByCategory: Record<string, number> = {}
    let totalSpent = 0

    for (const order of deliveredOrders ?? []) {
      totalSpent += Number(order.total_estimated_cost || 0)
      const items = order.material_order_items as Array<{
        unit_price: number
        quantity_delivered: number | null
        quantity_requested: number
        materials: Array<{ category: string }>
      }> | null
      for (const item of items ?? []) {
        const cat = item.materials?.[0]?.category || 'other'
        const qty = Number(item.quantity_delivered || item.quantity_requested)
        const cost = qty * Number(item.unit_price)
        spendByCategory[cat] = (spendByCategory[cat] || 0) + cost
      }
    }

    // 3. Pending orders count
    const { count: pendingOrders } = await supabase
      .from('material_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending_approval', 'approved', 'ordered'])

    // 4. Top consumed materials (from treatment_materials_used in period)
    const { data: consumption } = await supabase
      .from('treatment_materials_used')
      .select('material_id, quantity_used, materials(name_uk)')
      .gte('created_at', sinceISO)

    const consumptionMap: Record<string, { name: string; total: number }> = {}
    for (const row of consumption ?? []) {
      const mat =
        (row.materials as Array<{ name_uk: string }> | null)?.[0] ?? null
      const key = row.material_id
      if (!consumptionMap[key]) {
        consumptionMap[key] = {
          name: mat?.name_uk || '—',
          total: 0,
        }
      }
      consumptionMap[key].total += Number(row.quantity_used)
    }
    const topConsumed = Object.values(consumptionMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 5. Recent delivered orders
    const { data: recentOrders } = await supabase
      .from('material_orders')
      .select('id, total_estimated_cost, created_at, admin_users(display_name)')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        stockSummary: {
          totalMaterials,
          lowStockCount,
          totalSpent,
          pendingOrders: pendingOrders ?? 0,
        },
        spendingByCategory: Object.entries(spendByCategory).map(
          ([category, amount]) => ({ category, amount })
        ),
        topConsumed,
        stockLevels: stockLevels.sort(
          (a, b) => a.current / (a.min || 1) - b.current / (b.min || 1)
        ),
        recentOrders: (recentOrders ?? []).map(o => ({
          id: o.id,
          total: Number(o.total_estimated_cost),
          date: o.created_at,
          orderedBy:
            (
              o.admin_users as Array<{ display_name: string | null }> | null
            )?.[0]?.display_name || '—',
        })),
      },
    })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      context: 'inventory-analytics',
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити аналітику' },
      { status: 500 }
    )
  }
}
