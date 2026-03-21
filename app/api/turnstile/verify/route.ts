import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * POST /api/turnstile/verify
 * Server-side Cloudflare Turnstile token verification.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // If Turnstile is not configured, skip verification (dev / CI)
  if (!secretKey) {
    return NextResponse.json({
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: 'localhost',
    })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error_codes: ['invalid-json'] },
      { status: 400 }
    )
  }

  const { token } = body
  if (!token) {
    return NextResponse.json(
      { success: false, error_codes: ['missing-token'] },
      { status: 400 }
    )
  }

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (ip) formData.append('remoteip', ip)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    if (!res.ok) {
      console.error('[turnstile] Cloudflare API error:', res.status)
      return NextResponse.json(
        { success: false, error_codes: ['cloudflare-api-error'] },
        { status: 502 }
      )
    }

    const result = await res.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[turnstile] Verification error:', error)
    return NextResponse.json(
      { success: false, error_codes: ['internal-error'] },
      { status: 500 }
    )
  }
}
