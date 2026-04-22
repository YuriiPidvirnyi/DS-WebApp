import { NextRequest, NextResponse } from 'next/server'
import { requireStockAdmin, isV2On, flagOff } from '@/lib/stock-helpers'
import { hasPermission } from '@/lib/permissions'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { logger } from '@/utils/logger'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'inventory:view')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { data, error } = await auth.supabase.rpc(
    'report_critical_stock_reorder'
  )

  if (error) {
    logger.error('[stock/reports/reorder] error', { message: error.message })
    captureException(new Error('[stock/reports/reorder] RPC failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося отримати звіт' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
