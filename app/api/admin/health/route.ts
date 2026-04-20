import { NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis'
import { isEmailConfigured } from '@/lib/email'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export type ServiceStatus = 'ok' | 'error' | 'unconfigured'

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  latencyMs: number | null
  message?: string
}

async function checkSupabase(): Promise<ServiceHealth> {
  const t0 = Date.now()
  try {
    const supabase = await createClient()
    if (!supabase) {
      return { name: 'Supabase', status: 'unconfigured', latencyMs: null }
    }
    const { error } = await supabase.from('services').select('id').limit(1)
    const latencyMs = Date.now() - t0
    if (error) {
      return {
        name: 'Supabase',
        status: 'error',
        latencyMs,
        message: error.message,
      }
    }
    return { name: 'Supabase', status: 'ok', latencyMs }
  } catch (err) {
    return {
      name: 'Supabase',
      status: 'error',
      latencyMs: Date.now() - t0,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const t0 = Date.now()
  try {
    if (!redis) {
      return { name: 'Upstash Redis', status: 'unconfigured', latencyMs: null }
    }
    await redis.ping()
    return { name: 'Upstash Redis', status: 'ok', latencyMs: Date.now() - t0 }
  } catch (err) {
    return {
      name: 'Upstash Redis',
      status: 'error',
      latencyMs: Date.now() - t0,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

function checkResend(): ServiceHealth {
  if (!isEmailConfigured()) {
    return { name: 'Resend', status: 'unconfigured', latencyMs: null }
  }
  return {
    name: 'Resend',
    status: 'ok',
    latencyMs: null,
    message: 'API key present',
  }
}

function checkSentry(): ServiceHealth {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  )
  if (!configured) {
    return { name: 'Sentry', status: 'unconfigured', latencyMs: null }
  }
  return {
    name: 'Sentry',
    status: 'ok',
    latencyMs: null,
    message: 'DSN present',
  }
}

export async function GET() {
  try {
    const supabaseClient = await createClient()
    if (!supabaseClient) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminAccess = await getAdminAccess(supabaseClient, user.id)
    if (!adminAccess || !hasPermission(adminAccess.role, 'analytics:view')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const [supabaseHealth, redisHealth] = await Promise.all([
      checkSupabase(),
      checkRedis(),
    ])

    const services: ServiceHealth[] = [
      supabaseHealth,
      redisHealth,
      checkResend(),
      checkSentry(),
    ]

    const overallOk = services.every(s => s.status !== 'error')

    return NextResponse.json(
      {
        success: true,
        ok: overallOk,
        services,
        checkedAt: new Date().toISOString(),
      },
      { status: overallOk ? 200 : 207 }
    )
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
