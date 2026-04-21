import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/utils/sentry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const t0 = Date.now()
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'not configured' })
    }
    const { error } = await supabase.from('services').select('id').limit(1)
    const latency = Date.now() - t0
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, latency })
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
