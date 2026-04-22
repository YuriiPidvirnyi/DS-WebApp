import { NextRequest, NextResponse } from 'next/server'
import {
  requireStockAdmin,
  isV2On,
  flagOff,
  stockNotFound,
} from '@/lib/stock-helpers'
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

  const FIELDS: Record<string, string> = {
    name: 'name',
    nameEn: 'name_en',
    namePl: 'name_pl',
    legalName: 'legal_name',
    edrpou: 'edrpou',
    vatNumber: 'vat_number',
    legalAddress: 'legal_address',
    shippingAddress: 'shipping_address',
    phone: 'phone',
    email: 'email',
    website: 'website',
    paymentTerms: 'payment_terms',
    contactPerson: 'contact_person',
    sortOrder: 'sort_order',
    comment: 'comment',
    isArchived: 'is_archived',
  }

  const patch: Record<string, unknown> = {}
  for (const [jsKey, dbKey] of Object.entries(FIELDS)) {
    if (jsKey in body) patch[dbKey] = body[jsKey] === '' ? null : body[jsKey]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає полів для оновлення' },
      { status: 400 }
    )
  }
  patch.updated_at = new Date().toISOString()

  const { data, error } = await auth.supabase
    .from('material_suppliers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') return stockNotFound()
    logger.error('[stock/suppliers/:id] PATCH error', {
      message: error?.message,
    })
    captureException(new Error('[stock/suppliers/:id] PATCH failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося оновити постачальника' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
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

  // Check for referenced documents — archive instead of hard delete
  const { count } = await auth.supabase
    .from('stock_documents')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', id)

  if ((count ?? 0) > 0) {
    const { data, error } = await auth.supabase
      .from('material_suppliers')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[stock/suppliers/:id] archive error', {
        message: error.message,
      })
      captureException(new Error('[stock/suppliers/:id] archive failed'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Не вдалося архівувати постачальника' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, archived: true, data })
  }

  const { error } = await auth.supabase
    .from('material_suppliers')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('[stock/suppliers/:id] DELETE error', {
      message: error.message,
    })
    captureException(new Error('[stock/suppliers/:id] DELETE failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося видалити постачальника' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, deleted: true })
}
