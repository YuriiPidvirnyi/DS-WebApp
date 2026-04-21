import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
  verifyTurnstileServer,
  turnstileInvalidResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const contactSchema = z.object({
  name: z.string().min(1, "Ім'я є обов'язковим").max(100),
  phone: z
    .string()
    .regex(/^\+380\d{9}$/, 'Невірний формат телефону (+380XXXXXXXXX)'),
  message: z.string().min(1, "Повідомлення є обов'язковим").max(2000),
  email: z.string().email('Невірний формат email').optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
})

type ContactSchemaInput = z.infer<typeof contactSchema>

function splitFullName(fullName: string): {
  firstName: string
  lastName?: string
} {
  const normalized = fullName.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { firstName: '' }
  }

  const [firstName, ...rest] = normalized.split(' ')
  const lastName = rest.join(' ').trim()
  return { firstName, lastName: lastName || undefined }
}

function normalizeContactPayload(body: ContactSchemaInput): {
  displayName: string
  firstName: string
  lastName?: string
  phone: string
  email?: string
  message?: string
} {
  const providedName = typeof body.name === 'string' ? body.name.trim() : ''
  const providedFirstName =
    typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const providedLastName =
    typeof body.lastName === 'string' ? body.lastName.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  const fromName = splitFullName(providedName)
  const firstName = providedFirstName || fromName.firstName
  const lastName = providedLastName || fromName.lastName
  const displayName =
    providedName || [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    displayName,
    firstName,
    lastName,
    phone,
    email: email || undefined,
    message: message || undefined,
  }
}

/** POST /api/contacts */
export async function POST(request: NextRequest) {
  // CSRF validation
  if (!validateCSRF(request)) return csrfErrorResponse()

  // Rate limiting: 10 requests per minute
  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  let rawBody: unknown

  try {
    const parsed = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid JSON body')
    }
    rawBody = parsed
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const cfToken = (rawBody as Record<string, unknown>).cf_turnstile_response as
    | string
    | undefined
  const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
  if (!botOk) return turnstileInvalidResponse()

  const parseResult = contactSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Невірний запит'
    return NextResponse.json(
      { success: false, error: firstError },
      { status: 400 }
    )
  }

  const body: ContactSchemaInput = parseResult.data
  const normalized = normalizeContactPayload(body)

  // Required: name + phone (post-normalize checks kept for safety)
  if (!normalized.firstName) {
    return NextResponse.json(
      { success: false, error: "Ім'я є обов'язковим" },
      { status: 400 }
    )
  }

  try {
    // Save to Supabase
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Внутрішня помилка сервера' },
        { status: 500 }
      )
    }

    const submissionId = crypto.randomUUID()
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        id: submissionId,
        name: normalized.displayName || normalized.firstName,
        phone: normalized.phone,
        email: normalized.email || null,
        message: normalized.message || null,
      })

    if (dbError) {
      captureException(new Error('[contacts] Supabase insert error'), {
        supabaseError: dbError,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Не вдалося зберегти звернення. Спробуйте ще раз.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: submissionId },
        message: "Дякуємо! Ми зв'яжемося з вами найближчим часом.",
      },
      { status: 201 }
    )
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
