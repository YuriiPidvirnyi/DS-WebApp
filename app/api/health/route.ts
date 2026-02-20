import { NextResponse } from 'next/server'
import { pingCliniCards, CliniCardsError } from '@/lib/clinicards-client'

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
    try {
      const upstream = await pingCliniCards()
      return NextResponse.json({
        ...base,
        upstream: { status: upstream.status, version: upstream.version },
      })
    } catch (error) {
      const msg =
        error instanceof CliniCardsError ? error.message : 'unreachable'
      return NextResponse.json(
        { ...base, status: 'degraded', upstream: { error: msg } },
        { status: 200 } // still 200 — our service is up
      )
    }
  }

  return NextResponse.json(base)
}
