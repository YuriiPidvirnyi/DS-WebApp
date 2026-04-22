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

const VALID_KINDS = new Set(['main', 'cabinet', 'doctor', 'other'])

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const includeArchived =
    request.nextUrl.searchParams.get('includeArchived') === 'true'

  let query = auth.supabase
    .from('stock_warehouses')
    .select('*')
    .order('sort_order', { ascending: true })
  if (!includeArchived) query = query.eq('is_archived', false)

  const { data, error } = await query
  if (error) {
    logger.error('[stock/warehouses] GET error', { message: error.message })
    captureException(new Error('[stock/warehouses] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження складів' },
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
  const kind = typeof body.kind === 'string' ? body.kind : ''
  if (!nameUk)
    return NextResponse.json(
      { success: false, error: "nameUk обов'язковий" },
      { status: 422 }
    )
  if (!VALID_KINDS.has(kind))
    return NextResponse.json(
      { success: false, error: 'Невалідний kind' },
      { status: 422 }
    )

  const { data, error } = await auth.supabase
    .from('stock_warehouses')
    .insert({
      name_uk: nameUk,
      name_en: (body.nameEn as string) || null,
      name_pl: (body.namePl as string) || null,
      kind,
      is_main: kind === 'main',
      responsible_user_id: (body.responsibleUserId as string) || null,
      doctor_id: (body.doctorId as string) || null,
      comment: (body.comment as string) || null,
      sort_order: Number(body.sortOrder ?? 0),
    })
    .select()
    .single()

  if (error) {
    logger.error('[stock/warehouses] POST error', { message: error.message })
    captureException(new Error('[stock/warehouses] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити склад' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
