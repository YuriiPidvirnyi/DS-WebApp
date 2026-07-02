import { NextRequest, NextResponse } from 'next/server'
import {
  getMonobankStatement,
  getMonobankMerchantDetails,
  analyzeStatement,
  isMonobankConfigured,
} from '@/lib/monobank'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Statement calls can be slow for wide date ranges — generous timeout
export const maxDuration = 60

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  return Boolean(secret && auth === `Bearer ${secret}`)
}

/**
 * GET /api/payments/analytics
 *
 * Query params:
 *   from  — required. ISO-8601 date or unix timestamp (seconds). E.g. 2026-03-01 or 1740787200
 *   to    — optional. Same format. Defaults to now.
 *   code  — optional. Submerchant terminal code.
 *   raw   — optional. Pass raw=1 to include the full transaction list in the response.
 *
 * Auth: Bearer <CRON_SECRET>
 *
 * Response:
 *   { success: true, data: { merchant, summary, items? } }
 */
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isMonobankConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Платіжна система не налаштована' },
      { status: 503 }
    )
  }

  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const code = searchParams.get('code') ?? undefined
  const includeRaw = searchParams.get('raw') === '1'

  if (!fromParam) {
    return NextResponse.json(
      {
        success: false,
        error: 'Параметр from обовʼязковий (ISO дата або unix timestamp)',
      },
      { status: 400 }
    )
  }

  const fromDate = parseDate(fromParam)
  const toDate = toParam ? parseDate(toParam) : new Date()

  if (!fromDate || !toDate) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Невалідний формат дати. Очікується ISO-8601 або unix timestamp.',
      },
      { status: 400 }
    )
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { success: false, error: 'from має бути раніше ніж to' },
      { status: 400 }
    )
  }

  const fromTs = Math.floor(fromDate.getTime() / 1000)
  const toTs = Math.floor(toDate.getTime() / 1000)

  logger.info('[payments/analytics] Fetching statement', {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    code,
  })

  let items, merchant
  try {
    // Fetch in parallel — statement (rate-limited: 1/s, single call) + merchant details
    ;[items, merchant] = await Promise.all([
      getMonobankStatement(fromTs, toTs, code),
      getMonobankMerchantDetails(),
    ])
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      context: 'payments/analytics',
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося отримати виписку' },
      { status: 502 }
    )
  }

  const summary = analyzeStatement(items, fromDate, toDate)

  logger.info('[payments/analytics] Statement ready', {
    transactions: items.length,
    netRevenue: summary.successful.netRevenue,
  })

  return NextResponse.json({
    success: true,
    data: {
      merchant,
      summary,
      ...(includeRaw ? { items } : {}),
    },
  })
}

function parseDate(value: string): Date | null {
  // Unix timestamp (all digits)
  if (/^\d+$/.test(value)) {
    const ts = parseInt(value, 10)
    // Accept both seconds and milliseconds
    const ms = ts > 1e10 ? ts : ts * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }
  // ISO-8601
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}
