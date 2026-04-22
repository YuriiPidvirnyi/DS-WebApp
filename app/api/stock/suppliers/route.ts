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
    .from('material_suppliers')
    .select('*')
    .order('sort_order', { ascending: true })

  if (!includeArchived) query = query.eq('is_archived', false)

  const { data, error } = await query
  if (error) {
    logger.error('[stock/suppliers] GET error', { message: error.message })
    captureException(new Error('[stock/suppliers] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження постачальників' },
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

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name)
    return NextResponse.json(
      { success: false, error: "name обов'язковий" },
      { status: 422 }
    )

  const { data, error } = await auth.supabase
    .from('material_suppliers')
    .insert({
      name,
      name_en: (body.nameEn as string) || null,
      name_pl: (body.namePl as string) || null,
      legal_name: (body.legalName as string) || null,
      edrpou: (body.edrpou as string) || null,
      vat_number: (body.vatNumber as string) || null,
      legal_address: (body.legalAddress as string) || null,
      shipping_address: (body.shippingAddress as string) || null,
      phone: (body.phone as string) || null,
      email: (body.email as string) || null,
      website: (body.website as string) || null,
      payment_terms: (body.paymentTerms as string) || null,
      contact_person: (body.contactPerson as string) || null,
      sort_order: Number(body.sortOrder ?? 0),
      comment: (body.comment as string) || null,
    })
    .select()
    .single()

  if (error) {
    logger.error('[stock/suppliers] POST error', { message: error.message })
    captureException(new Error('[stock/suppliers] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити постачальника' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
