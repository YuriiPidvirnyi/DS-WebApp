import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const URGENCY_VALUES = new Set(['low', 'normal', 'high', 'critical'])

const ORDER_LIST_SELECT = `
  id,
  ordered_by,
  status,
  total_estimated_cost,
  notes,
  urgency,
  created_at,
  material_order_items (
    id,
    material_id,
    quantity_requested,
    quantity_delivered,
    unit_price,
    created_at,
    materials ( name_uk, name_en, name_pl )
  ),
  admin_users ( id, display_name, role )
`

type AdminResult =
  | { supabase: SupabaseClient; user: User }
  | { error: NextResponse }

async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user }
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** GET /api/material-orders */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const orderedBy = searchParams.get('orderedBy')

  let query = supabase
    .from('material_orders')
    .select(ORDER_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (orderedBy) {
    query = query.eq('ordered_by', orderedBy)
  }

  const { data, error } = await query

  if (error) {
    captureException(new Error('[material-orders] Supabase GET error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити замовлення' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

/** POST /api/material-orders */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase, user } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const rawItems = body.items
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Потрібен непорожній масив items' },
      { status: 400 }
    )
  }

  const notes =
    typeof body.notes === 'string' ? body.notes.trim() || null : null
  const urgency = typeof body.urgency === 'string' ? body.urgency : 'normal'
  if (!URGENCY_VALUES.has(urgency)) {
    return NextResponse.json(
      { success: false, error: 'Невалідне значення urgency' },
      { status: 400 }
    )
  }

  type LineInput = {
    materialId: string
    quantityRequested: number
    unitPrice: number
  }

  const lines: LineInput[] = []
  for (const row of rawItems) {
    if (!row || typeof row !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Невалідний елемент items' },
        { status: 400 }
      )
    }
    const r = row as Record<string, unknown>
    const materialId =
      typeof r.materialId === 'string' ? r.materialId.trim() : ''
    const quantityRequested = Number(r.quantityRequested)
    const unitPrice = Number(r.unitPrice)
    if (!materialId) {
      return NextResponse.json(
        { success: false, error: 'Кожен рядок потребує materialId' },
        { status: 400 }
      )
    }
    if (Number.isNaN(quantityRequested) || quantityRequested <= 0) {
      return NextResponse.json(
        { success: false, error: 'Невалідне quantityRequested' },
        { status: 400 }
      )
    }
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Невалідне unitPrice' },
        { status: 400 }
      )
    }
    lines.push({ materialId, quantityRequested, unitPrice })
  }

  const totalEstimatedCost = roundMoney(
    lines.reduce((acc, l) => acc + l.quantityRequested * l.unitPrice, 0)
  )

  const { data: order, error: orderError } = await supabase
    .from('material_orders')
    .insert({
      ordered_by: user.id,
      status: 'draft',
      total_estimated_cost: totalEstimatedCost,
      notes,
      urgency,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    captureException(new Error('[material-orders] Supabase POST order error'), {
      supabaseError: orderError,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити замовлення' },
      { status: 500 }
    )
  }

  const itemRows = lines.map(l => ({
    material_order_id: order.id,
    material_id: l.materialId,
    quantity_requested: l.quantityRequested,
    quantity_delivered: 0,
    unit_price: l.unitPrice,
  }))

  const { error: itemsError } = await supabase
    .from('material_order_items')
    .insert(itemRows)

  if (itemsError) {
    captureException(new Error('[material-orders] Supabase POST items error'), {
      supabaseError: itemsError,
    })
    await supabase.from('material_orders').delete().eq('id', order.id)
    return NextResponse.json(
      { success: false, error: 'Не вдалося додати позиції замовлення' },
      { status: 500 }
    )
  }

  const { data: fullOrder, error: fetchError } = await supabase
    .from('material_orders')
    .select(ORDER_LIST_SELECT)
    .eq('id', order.id)
    .maybeSingle()

  if (fetchError || !fullOrder) {
    captureException(new Error('[material-orders] Supabase POST fetch error'), {
      supabaseError: fetchError,
    })
    return NextResponse.json(
      { success: true, data: { id: order.id } },
      { status: 201 }
    )
  }

  return NextResponse.json({ success: true, data: fullOrder }, { status: 201 })
}
