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

/**
 * POST /api/stock/calc-cards/substitute
 * body: { from: UUID, to: UUID }
 * Replaces `from` with `to` across all active calc cards (is_replaceable=true lines only).
 */
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

  const from = body.from as string
  const to = body.to as string

  if (!from || !to) {
    return NextResponse.json(
      { success: false, error: 'from та to є обовʼязковими' },
      { status: 400 }
    )
  }

  if (from === to) {
    return NextResponse.json(
      { success: false, error: 'from та to мають бути різними матеріалами' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase.rpc(
    'substitute_material_across_calc_cards',
    { p_from_material_id: from, p_to_material_id: to }
  )

  if (error) {
    logger.error('[stock/calc-cards/substitute] error', {
      message: error.message,
    })
    captureException(new Error('[stock/calc-cards/substitute] RPC failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося замінити матеріал' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, rowsUpdated: data ?? 0 })
}
