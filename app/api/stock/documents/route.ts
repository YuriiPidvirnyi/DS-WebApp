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
import type { DocType } from '@/types/stock'
import type { Permission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_DOC_TYPES = new Set<DocType>([
  'incoming',
  'writeoff',
  'return',
  'transfer',
  'adjustment',
])
const PAGE_SIZE = 50

const DOC_TYPE_PERMISSION: Record<DocType, Permission> = {
  incoming: 'inventory:view',
  writeoff: 'inventory:view',
  return: 'inventory:view',
  transfer: 'inventory:view',
  adjustment: 'inventory:view',
}

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

  const sp = request.nextUrl.searchParams
  const docType = sp.get('docType') as DocType | null
  const status = sp.get('status')
  const warehouseId = sp.get('warehouseId')
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = auth.supabase
    .from('stock_documents')
    .select('*, items:stock_document_items(count)', { count: 'exact' })
    .order('doc_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (docType) {
    if (!VALID_DOC_TYPES.has(docType)) {
      return NextResponse.json(
        { success: false, error: 'Невалідний docType' },
        { status: 422 }
      )
    }
    query = query.eq('doc_type', docType)
  }

  if (status) query = query.eq('status', status)

  if (warehouseId) {
    query = query.or(
      `warehouse_from_id.eq.${warehouseId},warehouse_to_id.eq.${warehouseId}`
    )
  }

  const { data, error, count } = await query

  if (error) {
    logger.error('[stock/documents] GET error', { message: error.message })
    captureException(new Error('[stock/documents] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження документів' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: data ?? [],
    meta: { total: count ?? 0, page, pageSize: PAGE_SIZE },
  })
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

  const docType = body.docType as DocType
  if (!docType || !VALID_DOC_TYPES.has(docType)) {
    return NextResponse.json(
      { success: false, error: 'Невалідний docType' },
      { status: 422 }
    )
  }

  // Check doc-type-specific permission
  const requiredPerm = DOC_TYPE_PERMISSION[docType]
  if (!hasPermission(auth.access.role, requiredPerm)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Insufficient permissions for this document type',
      },
      { status: 403 }
    )
  }

  // Generate doc number via DB function
  const { data: numData, error: numErr } = await auth.supabase.rpc(
    'next_doc_number',
    { p_doc_type: docType }
  )
  if (numErr || !numData) {
    logger.error('[stock/documents] next_doc_number error', {
      message: numErr?.message,
    })
    captureException(new Error('[stock/documents] next_doc_number failed'), {
      supabaseError: numErr,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося згенерувати номер документа' },
      { status: 500 }
    )
  }

  const docDate =
    typeof body.docDate === 'string'
      ? body.docDate
      : new Date().toISOString().slice(0, 10)

  const insert: Record<string, unknown> = {
    doc_type: docType,
    doc_number: numData,
    status: 'draft',
    doc_date: docDate,
    responsible_user_id: (body.responsibleUserId as string) || auth.user.id,
    comment: (body.comment as string) || null,
    total_amount: 0,
  }

  if (docType === 'incoming' || docType === 'return') {
    if (!body.warehouseTo) {
      return NextResponse.json(
        {
          success: false,
          error: "warehouseTo обов'язковий для incoming/return",
        },
        { status: 422 }
      )
    }
    insert.warehouse_to_id = body.warehouseTo
    insert.supplier_id = (body.supplierId as string) || null
  }

  if (docType === 'writeoff') {
    if (!body.warehouseFrom) {
      return NextResponse.json(
        { success: false, error: "warehouseFrom обов'язковий для writeoff" },
        { status: 422 }
      )
    }
    insert.warehouse_from_id = body.warehouseFrom
  }

  if (docType === 'transfer') {
    if (!body.warehouseFrom || !body.warehouseTo) {
      return NextResponse.json(
        {
          success: false,
          error: "warehouseFrom та warehouseTo обов'язкові для transfer",
        },
        { status: 422 }
      )
    }
    insert.warehouse_from_id = body.warehouseFrom
    insert.warehouse_to_id = body.warehouseTo
  }

  if (docType === 'adjustment') {
    if (!body.warehouseTo) {
      return NextResponse.json(
        { success: false, error: "warehouseTo обов'язковий для adjustment" },
        { status: 422 }
      )
    }
    insert.warehouse_to_id = body.warehouseTo
  }

  const { data, error } = await auth.supabase
    .from('stock_documents')
    .insert(insert)
    .select()
    .single()

  if (error) {
    logger.error('[stock/documents] POST error', { message: error.message })
    captureException(new Error('[stock/documents] POST failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося створити документ' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
