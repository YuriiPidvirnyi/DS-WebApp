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

  const sp = request.nextUrl.searchParams
  const from = sp.get('from')
  const to = sp.get('to')

  if (!from || !to) {
    return NextResponse.json(
      { success: false, error: 'from та to є обовʼязковими' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase.rpc('report_writeoff', {
    p_from: from,
    p_to: to,
    p_warehouse_id: sp.get('warehouseId') ?? null,
    p_doctor_id: sp.get('doctorId') ?? null,
    p_service_id: sp.get('serviceId') ?? null,
  })

  if (error) {
    logger.error('[stock/reports/writeoff] error', { message: error.message })
    captureException(new Error('[stock/reports/writeoff] RPC failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося отримати звіт' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
