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

/** GET /api/stock/calc-cards — services list with card presence */
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

  const params = request.nextUrl.searchParams
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const pageSize = 50

  let query = auth.supabase
    .from('services')
    .select(
      'id, name_uk, category, price_uah, service_calculation_cards(id, is_active)',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name_uk', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) query = query.ilike('name_uk', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    logger.error('[stock/calc-cards] GET error', { message: error.message })
    captureException(new Error('[stock/calc-cards] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити список послуг' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: data ?? [],
    meta: { total: count ?? 0, page, pageSize },
  })
}

/** POST /api/stock/calc-cards — create/upsert a calc card for a service */
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

  const serviceId = body.serviceId as string
  if (!serviceId) {
    return NextResponse.json(
      { success: false, error: 'serviceId є обовʼязковим' },
      { status: 400 }
    )
  }

  // Upsert card
  const { data: card, error: cardErr } = await auth.supabase
    .from('service_calculation_cards')
    .upsert(
      { service_id: serviceId, is_active: true },
      { onConflict: 'service_id', ignoreDuplicates: false }
    )
    .select('id, service_id, is_active')
    .single()

  if (cardErr || !card) {
    logger.error('[stock/calc-cards] POST upsert error', {
      message: cardErr?.message,
    })
    captureException(new Error('[stock/calc-cards] POST upsert failed'), {
      supabaseError: cardErr ?? undefined,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити картку розрахунку' },
      { status: 500 }
    )
  }

  // Optional inline items on creation
  const items = Array.isArray(body.items) ? body.items : []
  if (items.length > 0) {
    const rows = items
      .filter(
        (i): i is { materialId: string; defaultUnitQty: number } =>
          i && typeof i === 'object' && 'materialId' in i
      )
      .map(i => ({
        card_id: card.id,
        material_id: i.materialId,
        default_unit_qty: Number(i.defaultUnitQty ?? 1),
        is_replaceable: Boolean(
          (i as Record<string, unknown>).isReplaceable ?? true
        ),
      }))

    if (rows.length > 0) {
      const { error: itemsErr } = await auth.supabase
        .from('service_calculation_card_items')
        .insert(rows)

      if (itemsErr) {
        logger.error('[stock/calc-cards] POST items insert error', {
          message: itemsErr.message,
        })
      }
    }
  }

  const { data: full } = await auth.supabase
    .from('service_calculation_cards')
    .select('id, service_id, is_active, service_calculation_card_items(*)')
    .eq('id', card.id)
    .single()

  return NextResponse.json(
    { success: true, data: full ?? card },
    { status: 201 }
  )
}
