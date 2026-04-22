import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createClient<any, 'public', any>>

function getServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * GET /api/cron/stock-metrics
 * Runs daily at 21:55 UTC (23:55 Kyiv time).
 * Calls snapshot_stock_metrics_daily() for yesterday and today
 * so late-arriving posted documents are captured.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Service client not configured' },
      { status: 503 }
    )
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10)
  const days = [toDateStr(yesterday), toDateStr(today)]
  const results: Record<string, string> = {}

  for (const day of days) {
    const { error } = await supabase.rpc('snapshot_stock_metrics_daily', {
      p_day: day,
    })
    results[day] = error ? `error: ${error.message}` : 'ok'
    if (error) {
      captureException(new Error(error.message), {
        context: 'cron/stock-metrics',
        extra: { day },
      })
    }
  }

  const anyError = Object.values(results).some(v => v.startsWith('error'))
  return NextResponse.json(
    { success: !anyError, days: results },
    { status: anyError ? 500 : 200 }
  )
}
