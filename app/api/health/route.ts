import { NextResponse } from 'next/server'
import { pingCliniCards, CliniCardsError } from '@/lib/clinicards-client'
import { getCacheStats } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const base = {
    status: 'ok' as const,
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production',
  }

  // Optionally probe CliniCards when API key is configured
  if (process.env.CLINICARDS_API_KEY) {
    const cache = await getCacheStats()
    try {
      const upstream = await pingCliniCards()
      return NextResponse.json({
        ...base,
        upstream: { status: upstream.status, version: upstream.version },
        cache,
      })
    } catch (error) {
      const msg =
        error instanceof CliniCardsError ? error.message : 'unreachable'
      return NextResponse.json(
        { ...base, status: 'degraded', upstream: { error: msg }, cache },
        { status: 200 }
      )
    }
  }

  const cache = await getCacheStats()
  return NextResponse.json({ ...base, cache })
}
