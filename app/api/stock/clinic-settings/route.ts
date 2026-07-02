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

const WRITABLE_KEYS = new Set([
  'allow_negative_balance',
  'writeoff_mode',
  'auto_ap_bill_on_incoming',
  'default_expense_category_id',
  'enforce_stock_permissions',
  'show_my_inventory',
])

export async function GET(request: NextRequest) {
  if (!isV2On()) return flagOff()
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  const { data, error } = await auth.supabase
    .from('clinic_settings')
    .select('key, value, updated_at, updated_by')

  if (error) {
    logger.error('[stock/clinic-settings] GET error', {
      message: error.message,
    })
    captureException(new Error('[stock/clinic-settings] GET failed'), {
      supabaseError: error,
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити налаштування' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  if (!isV2On()) return flagOff()
  if (!validateCSRF(request)) return csrfErrorResponse()
  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const auth = await requireStockAdmin()
  if ('error' in auth) return auth.error

  if (!hasPermission(auth.access.role, 'settings:edit')) {
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

  const updates: Array<{ key: string; value: unknown; updated_by: string }> = []
  for (const [key, value] of Object.entries(body)) {
    if (!WRITABLE_KEYS.has(key)) continue
    updates.push({ key, value, updated_by: auth.user.id })
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Немає дозволених ключів для оновлення' },
      { status: 400 }
    )
  }

  for (const u of updates) {
    await auth.supabase.from('clinic_settings').upsert({
      key: u.key,
      value: u.value,
      updated_by: u.updated_by,
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true, updated: updates.map(u => u.key) })
}
