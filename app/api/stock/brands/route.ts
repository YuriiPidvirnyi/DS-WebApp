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

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const includeArchived =
    request.nextUrl.searchParams.get('includeArchived') === 'true'

  let query = auth.supabase
    .from('material_brands')
    .select('*')
    .order('sort_order', { ascending: true })

  if (!includeArchived) query = query.eq('is_archived', false)

  const { data, error } = await query
  if (error) {
    logger.error('[stock/brands] GET error', { message: error.message })
    captureException(new Error('[stock/brands] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження брендів' },
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
  if (!nameUk)
    return NextResponse.json(
      { success: false, error: "nameUk обов'язковий" },
      { status: 422 }
    )

  const { data, error } = await auth.supabase
    .from('material_brands')
    .insert({
      name_uk: nameUk,
      name_en: (body.nameEn as string) || null,
      name_pl: (body.namePl as string) || null,
      country: (body.country as string) || null,
      website: (body.website as string) || null,
      logo_url: (body.logoUrl as string) || null,
      comment: (body.comment as string) || null,
      sort_order: Number(body.sortOrder ?? 0),
    })
    .select()
    .single()

  if (error) {
    logger.error('[stock/brands] POST error', { message: error.message })
    captureException(new Error('[stock/brands] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити бренд' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
