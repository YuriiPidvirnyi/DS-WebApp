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
import {
  intakeFormSchema,
  isPlausibleBirthDate,
} from '@/utils/validationSchemas'
import { intakeFormFields } from '@/content/intake-form-definitions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-side validation = the same schema the /anketa form runs (letters-only
// names, plausible birth date, field limits) + campaign attribution fields.
// This endpoint is public and directly scriptable, so it must never be weaker
// than the client-side schema.
const intakeSchema = intakeFormSchema.extend({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати')
    .refine(isPlausibleBirthDate, 'Невірна дата народження')
    .optional()
    .or(z.literal('')),
  // The form always sends these; keep them optional for other API callers
  pregnancy: z.enum(['', 'no', 'yes']).optional(),
  marketingConsent: z.boolean().optional(),
  promoCode: z
    .string()
    .max(32)
    .regex(/^[a-zA-Z0-9_-]*$/, 'Невірний промокод')
    .optional()
    .or(z.literal('')),
  source: z
    .string()
    .max(32)
    .regex(/^[a-zA-Z0-9_-]*$/)
    .optional()
    .or(z.literal('')),
})

const trimOrNull = (value: string | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const formTypeSchema = z.enum(['basic', 'adult', 'child']).default('basic')

/** Answers are validated strictly against the digitized questionnaire fields. */
function answersSchema(formType: 'adult' | 'child') {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of intakeFormFields(formType)) {
    if (field.kind === 'yesno') {
      shape[field.id] = z.enum(['', 'yes', 'no']).optional()
    } else if (field.kind === 'scale') {
      shape[field.id] = z
        .number()
        .int()
        .min(field.min)
        .max(field.max)
        .nullable()
        .optional()
    } else {
      shape[field.id] = z
        .string()
        .max(field.maxLength ?? 300)
        .optional()
    }
  }
  return z.object(shape).strict()
}

/** POST /api/intake — public patient intake questionnaire submission. */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  // Rate limiting: 5 submissions per minute per IP
  const { allowed, remaining } = await checkRateLimit(request, 5, 60_000)
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

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }

  // Link to the patient row when the visitor is signed in (guests → null)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Turnstile guards anonymous submissions; authenticated cabinet submissions
  // are already gated by the session (and still CSRF + rate limited).
  if (!user) {
    const cfToken = (rawBody as Record<string, unknown>)
      .cf_turnstile_response as string | undefined
    const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
    if (!botOk) return turnstileInvalidResponse()
  }

  const parseResult = intakeSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Невірний запит'
    return NextResponse.json(
      { success: false, error: firstError },
      { status: 400 }
    )
  }
  const body = parseResult.data

  const formTypeResult = formTypeSchema.safeParse(
    (rawBody as Record<string, unknown>).formType ?? 'basic'
  )
  if (!formTypeResult.success) {
    return NextResponse.json(
      { success: false, error: 'Невірний тип анкети' },
      { status: 400 }
    )
  }
  const formType = formTypeResult.data

  let answers: Record<string, unknown> | null = null
  if (formType !== 'basic') {
    const answersResult = answersSchema(formType).safeParse(
      (rawBody as Record<string, unknown>).answers ?? {}
    )
    if (!answersResult.success) {
      return NextResponse.json(
        { success: false, error: 'Невірні відповіді анкети' },
        { status: 400 }
      )
    }
    answers = answersResult.data
  }

  try {
    const { data: inserted, error: dbError } = await supabase
      .from('patient_intake_forms')
      .insert({
        patient_id: user?.id ?? null,
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        patronymic: trimOrNull(body.patronymic),
        phone: body.phone.startsWith('+') ? body.phone : `+${body.phone}`,
        email: trimOrNull(body.email),
        date_of_birth: trimOrNull(body.dateOfBirth),
        allergies: trimOrNull(body.allergies),
        medications: trimOrNull(body.medications),
        chronic_conditions: trimOrNull(body.chronicConditions),
        is_pregnant:
          body.pregnancy === 'yes'
            ? true
            : body.pregnancy === 'no'
              ? false
              : null,
        complaints: trimOrNull(body.complaints),
        data_consent: body.dataConsent,
        marketing_consent: body.marketingConsent ?? false,
        promo_code: trimOrNull(body.promoCode),
        source: trimOrNull(body.source) ?? 'direct',
        form_type: formType,
        answers,
        // Derived server-side — the client is not trusted for this
        submitted_via: user ? 'cabinet' : 'public',
      })
      .select('id')
      .single()

    if (dbError) {
      captureException(new Error('[intake] Supabase insert error'), {
        supabaseError: dbError,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Не вдалося зберегти анкету. Спробуйте ще раз.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: inserted.id as string },
        message: 'Дякуємо! Ваша анкета збережена.',
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
