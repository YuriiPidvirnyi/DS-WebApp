import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!redis) {
    return NextResponse.json({ ok: false, error: 'not configured' })
  }

  const t0 = Date.now()
  try {
    await redis.ping()
    const latency = Date.now() - t0
    return NextResponse.json({ ok: true, latency })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      latency: Date.now() - t0,
    })
  }
}
