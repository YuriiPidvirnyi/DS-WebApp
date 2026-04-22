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

/**
 * POST /api/stock/audits/:id/post
 * Calls post_inventory_audit RPC — creates adjustment stock documents per
 * warehouse and flips audit status to 'posted'. Irreversible.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
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

  const { data: audit } = await auth.supabase
    .from('inventory_audits')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!audit) return stockNotFound()

  if (audit.status !== 'draft') {
    return NextResponse.json(
      { success: false, error: 'Інвентаризацію вже проведено або анульовано' },
      { status: 409 }
    )
  }

  const { data, error } = await auth.supabase.rpc('post_inventory_audit', {
    p_audit_id: id,
  })

  if (error) {
    logger.error('[stock/audits/post] error', { message: error.message })
    captureException(new Error('[stock/audits/post] RPC failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося провести інвентаризацію' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, auditId: data })
}
