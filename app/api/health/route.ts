import { NextResponse } from 'next/server'
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

  const cache = await getCacheStats()
  return NextResponse.json({ ...base, cache })
}
