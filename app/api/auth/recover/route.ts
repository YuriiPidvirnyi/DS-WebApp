import { NextRequest, NextResponse, after } from 'next/server'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
  memoryRateLimit,
} from '@/lib/api-security'
import { checkRateLimit as checkKeyedRateLimit } from '@/lib/redis'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { passwordResetEmail } from '@/lib/email-templates'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dentalstory.ua'

// Per-email throttle: cap reset emails to one victim inbox regardless of source
// IP, so a distributed attacker can't spam it (the per-IP limit above is not
// enough on its own). Keyed by a hash of the normalized email — no PII in Redis.
const PER_EMAIL_MAX = 3
const PER_EMAIL_WINDOW_S = 15 * 60

async function perEmailAllowed(email: string): Promise<boolean> {
  const key = `pwreset:${createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')}`
  try {
    const { allowed } = await checkKeyedRateLimit(
      key,
      PER_EMAIL_MAX,
      PER_EMAIL_WINDOW_S
    )
    return allowed
  } catch {
    // Redis unavailable → fall back to the in-memory limiter rather than fully
    // failing open, so a Redis outage can't turn this into an email-bomb vector
    // (per-instance only, but bounded > unbounded).
    return memoryRateLimit(key, PER_EMAIL_MAX, PER_EMAIL_WINDOW_S * 1000)
      .allowed
  }
}

const bodySchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(['uk', 'en', 'pl']).optional(),
})

/**
 * POST /api/auth/recover — custom password-reset request.
 *
 * Why this exists instead of `supabase.auth.resetPasswordForEmail`: the default
 * Supabase recovery email links to `{SUPABASE_URL}/auth/v1/verify`, which burns
 * the one-time token on ANY GET — so an email-client link preview / security
 * scanner consumes it before the patient clicks, and the real click 403s
 * ("One-time token not found"). Here we mint the recovery token server-side via
 * the admin API and send our OWN branded email that links straight to the
 * click-gated `/auth/confirm`, so the token is only spent on an explicit click.
 *
 * Anti-enumeration: always responds 200 for a well-formed email, whether or not
 * an account exists and whether or not the send succeeds. Failures are logged
 * server-side only.
 */
/** Mint the token + send the branded email. Runs AFTER the response is sent so
 *  the request's timing can't be used to distinguish existing vs unknown emails
 *  (existing → generateLink work + Resend send; unknown → fast error, no send).
 *  Also applies the per-email throttle here (a suppressed send costs no time on
 *  the response path). Every branch swallows errors to Sentry — the client
 *  already received a uniform 200. */
async function deliverReset(
  email: string,
  locale: 'uk' | 'en' | 'pl'
): Promise<void> {
  try {
    if (!(await perEmailAllowed(email))) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      captureException(
        new Error('[auth/recover] SUPABASE service role not configured')
      )
      return
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fresh recovery token WITHOUT sending Supabase's own email. For 'recovery'
    // this errors (does not create a user) on an unknown email — swallowed.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })
    const tokenHash = data?.properties?.hashed_token
    if (error || !tokenHash) return

    if (!isEmailConfigured()) {
      captureException(
        new Error('[auth/recover] RESEND not configured — reset email not sent')
      )
      return
    }

    const resetUrl = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&type=recovery&next=${encodeURIComponent('/auth/reset-password')}`
    const firstName =
      (data?.user?.user_metadata?.first_name as string | undefined) ?? undefined
    const { subject, html, text } = passwordResetEmail(
      { resetUrl, patientName: firstName },
      locale
    )
    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
      tags: [{ name: 'type', value: 'password_reset' }],
    })
    if (!result.success) {
      captureException(
        new Error(`[auth/recover] reset email send failed: ${result.error}`)
      )
    }
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
  }
}

export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Невірний формат email' },
      { status: 400 }
    )
  }
  const { email, locale = 'uk' } = parsed.data

  // Defer all account-existence-dependent work past the response so the timing
  // of this handler is uniform (no enumeration side-channel). The response is
  // always a uniform 200 regardless of whether the account exists.
  after(() => deliverReset(email, locale))

  return NextResponse.json({ success: true }, { status: 200 })
}
