import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AiUsageRow {
  route: string
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { allowed, remaining } = await checkRateLimit(request, 40, 60_000)
    if (!allowed) return rateLimitResponse(remaining)

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

    const days = Math.min(
      parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10),
      90
    )
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('ai_usage')
      .select('route, model, input_tokens, output_tokens, cost_usd, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      captureException(new Error('[api/admin/ai-usage] Query error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const rows: AiUsageRow[] = data ?? []

    const totals = rows.reduce(
      (acc, r) => ({
        inputTokens: acc.inputTokens + (r.input_tokens ?? 0),
        outputTokens: acc.outputTokens + (r.output_tokens ?? 0),
        costUsd: acc.costUsd + (r.cost_usd ?? 0),
        requests: acc.requests + 1,
      }),
      { inputTokens: 0, outputTokens: 0, costUsd: 0, requests: 0 }
    )

    const byDayMap = new Map<
      string,
      { requests: number; costUsd: number; tokens: number }
    >()
    for (const r of rows) {
      const day = r.created_at.slice(0, 10)
      const prev = byDayMap.get(day) ?? { requests: 0, costUsd: 0, tokens: 0 }
      byDayMap.set(day, {
        requests: prev.requests + 1,
        costUsd: prev.costUsd + (r.cost_usd ?? 0),
        tokens: prev.tokens + (r.input_tokens ?? 0) + (r.output_tokens ?? 0),
      })
    }

    const byRouteMap = new Map<string, { requests: number; costUsd: number }>()
    for (const r of rows) {
      const prev = byRouteMap.get(r.route) ?? { requests: 0, costUsd: 0 }
      byRouteMap.set(r.route, {
        requests: prev.requests + 1,
        costUsd: prev.costUsd + (r.cost_usd ?? 0),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totals,
        daily: Array.from(byDayMap.entries()).map(([date, v]) => ({
          date,
          ...v,
        })),
        byRoute: Array.from(byRouteMap.entries()).map(([route, v]) => ({
          route,
          ...v,
        })),
      },
    })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
