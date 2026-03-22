import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'DentalStory <noreply@dentalstory.com.ua>'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(RESEND_API_KEY)
  }
  return _resend
}

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

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured — skipping send')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      tags: params.tags,
    })

    if (error) {
      console.error('[email] Resend API error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id ?? 'unknown' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email] Send failed:', message)
    return { success: false, error: message }
  }
}

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY
}
