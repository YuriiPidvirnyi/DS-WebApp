import { NextResponse } from 'next/server'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ ok: false, error: 'not configured' })
  }

  const t0 = Date.now()
  try {
    const res = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    })
    const latency = Date.now() - t0
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `Resend API returned HTTP ${res.status}`,
        latency,
      })
    }
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
