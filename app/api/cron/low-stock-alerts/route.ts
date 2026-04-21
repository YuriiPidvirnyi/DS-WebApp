import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const CRON_SECRET = process.env.CRON_SECRET ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createClient<any, 'public', any>>

function getServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function startCronRun(
  supabase: ServiceClient,
  name: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('cron_runs')
      .insert({ name, status: 'running' })
      .select('id')
      .single()
    return (data as { id: string } | null)?.id ?? null
  } catch {
    return null
  }
}

async function finishCronRun(
  supabase: ServiceClient,
  runId: string | null,
  processed: number,
  error?: string
): Promise<void> {
  if (!runId) return
  try {
    await supabase
      .from('cron_runs')
      .update({
        status: error ? 'error' : 'ok',
        finished_at: new Date().toISOString(),
        processed,
        ...(error ? { error } : {}),
      })
      .eq('id', runId)
  } catch {
    // non-blocking
  }
}

/**
 * GET /api/cron/low-stock-alerts
 * Runs weekdays at 08:00 UTC (10:00 Kyiv).
 * Finds active materials where current stock < min_stock_level
 * and inserts notification_events for admin alerting.
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

  const runId = await startCronRun(supabase, 'low-stock-alerts')

  try {
    const { data: materials, error: matErr } = await supabase
      .from('materials')
      .select(
        'id, name_uk, min_stock_level, material_inventory(current_quantity)'
      )
      .eq('is_active', true)

    if (matErr) throw matErr
    if (!materials?.length) {
      return NextResponse.json({ success: true, checked: 0, alerts: 0 })
    }

    const lowStock: Array<{
      id: string
      name: string
      current: number
      min: number
    }> = []

    for (const mat of materials) {
      const inv = mat.material_inventory as Array<{
        current_quantity: number | string
      }> | null
      const total = (inv ?? []).reduce(
        (acc: number, r: { current_quantity: number | string }) =>
          acc + Number(r.current_quantity || 0),
        0
      )
      if (total < Number(mat.min_stock_level)) {
        lowStock.push({
          id: mat.id,
          name: mat.name_uk,
          current: total,
          min: Number(mat.min_stock_level),
        })
      }
    }

    if (!lowStock.length) {
      return NextResponse.json({
        success: true,
        checked: materials.length,
        alerts: 0,
      })
    }

    // Avoid duplicate alerts on the same day
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('notification_events')
      .select('id')
      .eq('type', 'low_stock_alert')
      .eq('status', 'queued')
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1)

    if (existing?.length) {
      return NextResponse.json({
        success: true,
        checked: materials.length,
        alerts: 0,
        skipped: 'Alert already queued today',
      })
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
    if (!adminEmail) {
      return NextResponse.json({
        success: true,
        checked: materials.length,
        alerts: lowStock.length,
        skipped: 'No ADMIN_NOTIFICATION_EMAIL configured',
      })
    }

    const materialList = lowStock
      .map(m => `${m.name}: ${m.current} / ${m.min}`)
      .join('\n')

    const { error: insertErr } = await supabase
      .from('notification_events')
      .insert({
        type: 'low_stock_alert',
        recipient_email: adminEmail,
        status: 'queued',
        scheduled_at: new Date().toISOString(),
        details: {
          subject: `Низький залишок: ${lowStock.length} матеріал(ів)`,
          materials: lowStock,
          text: `Увага! Наступні матеріали мають залишок нижче мінімального:\n\n${materialList}`,
        },
      })

    if (insertErr) throw insertErr

    await finishCronRun(supabase, runId, lowStock.length)

    return NextResponse.json({
      success: true,
      checked: materials.length,
      alerts: lowStock.length,
    })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      context: 'cron/low-stock-alerts',
    })
    await finishCronRun(
      supabase,
      runId,
      0,
      err instanceof Error ? err.message : String(err)
    )
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
