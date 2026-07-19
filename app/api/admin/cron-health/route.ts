import { NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface CronRunSummary {
  name: string
  last_started_at: string | null
  last_status: string | null
  last_processed: number | null
  last_error: string | null
  runs_24h: number
  errors_24h: number
}

// Names written to cron_runs by the Supabase pg_cron producers + the
// process-notifications edge fn (see supabase/migrations/20260718_cron_*.sql).
const KNOWN_CRONS = [
  'low-stock-alerts',
  'notifications',
  'recall',
  'reminders',
  'stock-metrics',
]

/**
 * GET /api/admin/cron-health
 * Returns cron_runs grouped by name for the last 24 hours.
 * Requires analytics:view permission.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAccess = await getAdminAccess(supabase, user.id)
    if (!adminAccess || !hasPermission(adminAccess.role, 'analytics:view')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: rows, error: queryError } = await supabase
      .from('cron_runs')
      .select('name, started_at, status, processed, error')
      .gte('started_at', since)
      .order('started_at', { ascending: false })

    if (queryError) {
      captureException(new Error('[api/admin/cron-health] Query error'), {
        supabaseError: queryError,
      })
      return NextResponse.json(
        { success: false, error: 'Failed to query cron_runs' },
        { status: 500 }
      )
    }

    // Group by name — most recent row is first due to ORDER BY started_at DESC
    const grouped = new Map<string, CronRunSummary>()

    for (const row of rows ?? []) {
      const name = row.name as string
      if (!grouped.has(name)) {
        grouped.set(name, {
          name,
          last_started_at: row.started_at as string | null,
          last_status: row.status as string | null,
          last_processed: row.processed as number | null,
          last_error: row.error as string | null,
          runs_24h: 0,
          errors_24h: 0,
        })
      }
      const entry = grouped.get(name)!
      entry.runs_24h++
      if (row.status === 'error') entry.errors_24h++
    }

    // Ensure all known cron names appear even if they have no runs in last 24 h
    for (const name of KNOWN_CRONS) {
      if (!grouped.has(name)) {
        grouped.set(name, {
          name,
          last_started_at: null,
          last_status: null,
          last_processed: null,
          last_error: null,
          runs_24h: 0,
          errors_24h: 0,
        })
      }
    }

    const summaries = Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    return NextResponse.json({ success: true, data: summaries })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[api/admin/cron-health] Unexpected error')
    )
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
