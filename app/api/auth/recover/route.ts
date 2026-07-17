import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { passwordResetEmail } from '@/lib/email-templates'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dentalstory.ua'

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

  // Uniform response for every valid request — never reveals whether the
  // account exists or whether email delivery succeeded.
  const genericOk = NextResponse.json({ success: true }, { status: 200 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    captureException(
      new Error('[auth/recover] SUPABASE service role not configured')
    )
    return genericOk
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // Generates a fresh recovery token WITHOUT sending Supabase's own email.
    // For type 'recovery' this errors (does not create a user) when the email
    // is unknown — which we swallow to avoid account enumeration.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    const tokenHash = data?.properties?.hashed_token
    if (error || !tokenHash) {
      return genericOk
    }

    const resetUrl = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&type=recovery&next=${encodeURIComponent('/auth/reset-password')}`

    if (!isEmailConfigured()) {
      captureException(
        new Error('[auth/recover] RESEND not configured — reset email not sent')
      )
      return genericOk
    }

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

    return genericOk
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)))
    return genericOk
  }
}
