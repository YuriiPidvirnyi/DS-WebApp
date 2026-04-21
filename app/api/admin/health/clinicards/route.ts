import { NextResponse } from 'next/server'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.CLINICARDS_API_URL
  if (!baseUrl) {
    return NextResponse.json({ ok: false, error: 'not configured', latency: 0 })
  }

  const t0 = Date.now()
  try {
    const res = await fetch(`${baseUrl}/ping`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    const latency = Date.now() - t0
    return NextResponse.json({ ok: res.ok, latency })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      latency: Date.now() - t0,
    })
  }
}
