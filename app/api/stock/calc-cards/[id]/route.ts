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

/** GET /api/stock/calc-cards/:id — card with items */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const { data, error } = await auth.supabase
    .from('service_calculation_cards')
    .select(
      `id, service_id, is_active, created_at,
       service_calculation_card_items(
         id, material_id, default_unit_qty, is_replaceable,
         materials(id, name_uk, unit)
       )`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    logger.error('[stock/calc-cards/:id] GET error', { message: error.message })
    captureException(new Error('[stock/calc-cards/:id] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити картку' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Картку не знайдено' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}

/** PATCH /api/stock/calc-cards/:id — replace all items + toggle is_active */
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

  // Verify card exists
  const { data: card, error: cardErr } = await auth.supabase
    .from('service_calculation_cards')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (cardErr || !card) {
    return NextResponse.json(
      { success: false, error: 'Картку не знайдено' },
      { status: 404 }
    )
  }

  // Update is_active if provided
  if (body.isActive !== undefined) {
    const { error: updErr } = await auth.supabase
      .from('service_calculation_cards')
      .update({ is_active: Boolean(body.isActive) })
      .eq('id', id)

    if (updErr) {
      logger.error('[stock/calc-cards/:id] PATCH update error', {
        message: updErr.message,
      })
      captureException(
        new Error('[stock/calc-cards/:id] PATCH update failed'),
        {
          supabaseError: updErr,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити картку' },
        { status: 500 }
      )
    }
  }

  // Replace items if provided
  if (Array.isArray(body.items)) {
    const { error: delErr } = await auth.supabase
      .from('service_calculation_card_items')
      .delete()
      .eq('card_id', id)

    if (delErr) {
      logger.error('[stock/calc-cards/:id] PATCH delete items error', {
        message: delErr.message,
      })
      captureException(
        new Error('[stock/calc-cards/:id] PATCH delete items failed'),
        { supabaseError: delErr }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося оновити позиції картки' },
        { status: 500 }
      )
    }

    const rows = (body.items as unknown[])
      .filter(
        (i): i is { materialId: string; defaultUnitQty: number } =>
          i !== null &&
          typeof i === 'object' &&
          typeof (i as Record<string, unknown>).materialId === 'string' &&
          Number((i as Record<string, unknown>).defaultUnitQty) > 0
      )
      .map(i => ({
        card_id: id,
        material_id: i.materialId,
        default_unit_qty: Number(i.defaultUnitQty),
        is_replaceable: Boolean(
          (i as Record<string, unknown>).isReplaceable ?? true
        ),
      }))

    if (rows.length > 0) {
      const { error: insErr } = await auth.supabase
        .from('service_calculation_card_items')
        .insert(rows)

      if (insErr) {
        logger.error('[stock/calc-cards/:id] PATCH insert items error', {
          message: insErr.message,
        })
        captureException(
          new Error('[stock/calc-cards/:id] PATCH insert items failed'),
          { supabaseError: insErr }
        )
        return NextResponse.json(
          { success: false, error: 'Не вдалося зберегти позиції картки' },
          { status: 500 }
        )
      }
    }
  }

  const { data: full } = await auth.supabase
    .from('service_calculation_cards')
    .select(
      `id, service_id, is_active,
       service_calculation_card_items(
         id, material_id, default_unit_qty, is_replaceable,
         materials(id, name_uk, unit)
       )`
    )
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, data: full })
}

/** DELETE /api/stock/calc-cards/:id — deactivate (soft) */
export async function DELETE(
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

  const { error } = await auth.supabase
    .from('service_calculation_cards')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    logger.error('[stock/calc-cards/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/calc-cards/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося деактивувати картку' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
