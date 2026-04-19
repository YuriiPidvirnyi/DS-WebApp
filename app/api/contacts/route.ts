import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  createContact,
  CliniCardsError,
  type ContactPayload,
} from '@/lib/clinicards-client'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

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

let hasLoggedMissingCliniCardsConfig = false

type IncomingContactPayload = Partial<
  ContactPayload & {
    name?: string
    email?: string
    message?: string
  }
>

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

function normalizeContactPayload(body: IncomingContactPayload): {
  displayName: string
  payload: ContactPayload
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
    payload: {
      firstName,
      lastName,
      phone,
      email: email || undefined,
      message: message || undefined,
      source: 'webapp',
    },
  }
}

function logCliniCardsFallback(error: unknown): void {
  if (error instanceof CliniCardsError && error.code === 'MISSING_API_KEY') {
    if (!hasLoggedMissingCliniCardsConfig) {
      logger.warn(
        '[contacts] CLINICARDS_API_KEY is missing; continuing with Supabase-only contact flow.'
      )
      hasLoggedMissingCliniCardsConfig = true
    }
    return
  }

  logger.warn('[contacts] CliniCards failed; using Supabase submission:', {
    data: error,
  })
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

  const parseResult = contactSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Невірний запит'
    return NextResponse.json(
      { success: false, error: firstError },
      { status: 400 }
    )
  }

  const body: ContactSchemaInput = parseResult.data
  const normalized = normalizeContactPayload(body as IncomingContactPayload)

  // Required: name + phone (post-normalize checks kept for safety)
  if (!normalized.payload.firstName) {
    return NextResponse.json(
      { success: false, error: "Ім'я є обов'язковим" },
      { status: 400 }
    )
  }

  let savedSubmissionId: string | null = null

  try {
    // Save to Supabase
    const supabase = await createClient()
    if (supabase) {
      const submissionId = crypto.randomUUID()
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          id: submissionId,
          name: normalized.displayName || normalized.payload.firstName,
          phone: normalized.payload.phone,
          email: normalized.payload.email || null,
          message: normalized.payload.message || null,
        })

      if (dbError) {
        captureException(new Error('[contacts] Supabase insert error'), {
          supabaseError: dbError,
        })
      } else {
        savedSubmissionId = submissionId
      }
    }

    // Also send to CliniCards if configured
    try {
      const data = await createContact(normalized.payload)
      return NextResponse.json(
        {
          success: true,
          data: { id: data.id || savedSubmissionId || crypto.randomUUID() },
        },
        { status: 201 }
      )
    } catch (cliniCardsError) {
      // If CliniCards fails, we still saved to Supabase
      if (savedSubmissionId) {
        logCliniCardsFallback(cliniCardsError)
        return NextResponse.json(
          {
            success: true,
            data: { id: savedSubmissionId },
            message: "Дякуємо! Ми зв'яжемося з вами найближчим часом.",
          },
          { status: 201 }
        )
      }

      throw cliniCardsError
    }
  } catch (error) {
    if (error instanceof CliniCardsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Не вдалося зберегти звернення. Спробуйте ще раз.',
          code: error.code,
        },
        { status: error.status || 503 }
      )
    }
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
