// Deno port of `src/lib/email.ts` (KEEP IN SYNC with that file).
//
// Uses a dependency-free `fetch` to the Resend REST API instead of the `resend`
// npm SDK — deterministic under the Edge runtime and matches the SDK's behaviour
// (same `SendResult` shape, same graceful "not configured"/error handling).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL =
  Deno.env.get('RESEND_FROM_EMAIL') ?? 'DentalStory <noreply@dentalstory.ua>'

export type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

export type SendResult =
  | { success: true; id: string }
  | { success: false; error: string }

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured — skipping send')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        tags: params.tags,
      }),
    })

    const data = await res.json().catch(() => ({}) as Record<string, unknown>)

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) || `Resend HTTP ${res.status}`
      console.error('[email] Resend API error:', message)
      return { success: false, error: String(message) }
    }

    return { success: true, id: (data?.id as string) ?? 'unknown' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email] Send failed:', message)
    return { success: false, error: message }
  }
}
