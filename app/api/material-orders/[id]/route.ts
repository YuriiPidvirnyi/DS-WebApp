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

type Params = { params: Promise<{ id: string }> }

const ORDER_STATUSES = new Set([
  'draft',
  'pending_approval',
  'approved',
  'ordered',
  'delivered',
  'cancelled',
])

const ORDER_DETAIL_SELECT = `
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

async function applyInventoryForDeliveredOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: items, error: itemsError } = await supabase
    .from('material_order_items')
    .select('material_id, quantity_requested, quantity_delivered')
    .eq('material_order_id', orderId)

  if (itemsError) {
    captureException(
      new Error('[material-orders/[id]] load items for inventory'),
      { supabaseError: itemsError }
    )
    return {
      ok: false,
      error: 'Не вдалося завантажити позиції для оновлення залишків',
    }
  }

  if (!items?.length) return { ok: true }

  const today = new Date().toISOString().slice(0, 10)

  for (const item of items) {
    const delivered =
      Number(item.quantity_delivered) > 0
        ? Number(item.quantity_delivered)
        : Number(item.quantity_requested)
    if (delivered <= 0) continue

    const { data: inv, error: invFetchErr } = await supabase
      .from('material_inventory')
      .select('id, current_quantity')
      .eq('material_id', item.material_id)
      .eq('storage_location', '')
      .maybeSingle()

    if (invFetchErr) {
      captureException(
        new Error('[material-orders/[id]] fetch inventory row'),
        { supabaseError: invFetchErr }
      )
      return { ok: false, error: 'Не вдалося прочитати залишки матеріалу' }
    }

    if (inv) {
      const nextQty = Number(inv.current_quantity) + delivered
      const { error: upErr } = await supabase
        .from('material_inventory')
        .update({
          current_quantity: nextQty,
          last_restocked_at: today,
        })
        .eq('id', inv.id)
      if (upErr) {
        captureException(new Error('[material-orders/[id]] update inventory'), {
          supabaseError: upErr,
        })
        return { ok: false, error: 'Не вдалося оновити залишки' }
      }
    } else {
      const { error: insErr } = await supabase
        .from('material_inventory')
        .insert({
          material_id: item.material_id,
          current_quantity: delivered,
          storage_location: '',
          last_restocked_at: today,
        })
      if (insErr) {
        captureException(new Error('[material-orders/[id]] insert inventory'), {
          supabaseError: insErr,
        })
        return { ok: false, error: 'Не вдалося створити запис залишків' }
      }
    }
  }

  return { ok: true }
}

/** GET /api/material-orders/:id */
export async function GET(request: NextRequest, { params }: Params) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { id } = await params

  const { data, error } = await supabase
    .from('material_orders')
    .select(ORDER_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    captureException(new Error('[material-orders/[id]] Supabase GET error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити замовлення' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Замовлення не знайдено' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}

const PATCHABLE_KEYS = new Set(['status', 'notes'])

/** PATCH /api/material-orders/:id */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

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

  const unknownKeys = Object.keys(body).filter(k => !PATCHABLE_KEYS.has(k))
  if (unknownKeys.length) {
    return NextResponse.json(
      { success: false, error: 'Дозволені лише поля status та notes' },
      { status: 400 }
    )
  }

  const { data: existing, error: loadError } = await supabase
    .from('material_orders')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (loadError) {
    captureException(new Error('[material-orders/[id]] Supabase PATCH load'), {
      supabaseError: loadError,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити замовлення' },
      { status: 500 }
    )
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Замовлення не знайдено' },
      { status: 404 }
    )
  }

  const update: Record<string, unknown> = {}
  if (typeof body.status === 'string') {
    if (!ORDER_STATUSES.has(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Невалідний статус' },
        { status: 400 }
      )
    }
    update.status = body.status
  }
  if (typeof body.notes === 'string') {
    update.notes = body.notes.trim() || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }

  const nextStatus =
    typeof update.status === 'string' ? update.status : existing.status
  const becomingDelivered =
    nextStatus === 'delivered' && existing.status !== 'delivered'

  if (becomingDelivered) {
    const invResult = await applyInventoryForDeliveredOrder(supabase, id)
    if (!invResult.ok) {
      return NextResponse.json(
        { success: false, error: invResult.error },
        { status: 500 }
      )
    }
  }

  const { data, error } = await supabase
    .from('material_orders')
    .update(update)
    .eq('id', id)
    .select(ORDER_DETAIL_SELECT)
    .maybeSingle()

  if (error) {
    captureException(new Error('[material-orders/[id]] Supabase PATCH error'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити замовлення' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Замовлення не знайдено' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}

/** DELETE /api/material-orders/:id — лише draft */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { id } = await params

  const { data: existing, error: loadError } = await supabase
    .from('material_orders')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (loadError) {
    captureException(new Error('[material-orders/[id]] Supabase DELETE load'), {
      supabaseError: loadError,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося перевірити замовлення' },
      { status: 500 }
    )
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Замовлення не знайдено' },
      { status: 404 }
    )
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      {
        success: false,
        error: 'Видалення можливе лише для замовлень у статусі draft',
      },
      { status: 400 }
    )
  }

  const { error: delError } = await supabase
    .from('material_orders')
    .delete()
    .eq('id', id)

  if (delError) {
    captureException(
      new Error('[material-orders/[id]] Supabase DELETE error'),
      {
        supabaseError: delError,
      }
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити замовлення' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: { id } })
}
