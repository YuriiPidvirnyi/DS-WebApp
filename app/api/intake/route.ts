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

const nameField = z
  .string()
  .min(2, 'Мінімум 2 символи')
  .max(50, 'Максимум 50 символів')

const intakeSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  patronymic: z.string().max(50).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?380\d{9}$/, 'Невірний формат телефону (+380XXXXXXXXX)'),
  email: z.string().email('Невірний формат email').optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати')
    .optional()
    .or(z.literal('')),
  allergies: z.string().max(500).optional(),
  medications: z.string().max(500).optional(),
  chronicConditions: z.string().max(500).optional(),
  pregnancy: z.enum(['', 'no', 'yes']).optional(),
  complaints: z.string().max(1000).optional(),
  dataConsent: z
    .boolean()
    .refine(
      val => val === true,
      'Потрібна згода на обробку персональних даних'
    ),
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

  const cfToken = (rawBody as Record<string, unknown>).cf_turnstile_response as
    | string
    | undefined
  const { valid: botOk } = await verifyTurnstileServer(cfToken, request)
  if (!botOk) return turnstileInvalidResponse()

  const parseResult = intakeSchema.safeParse(rawBody)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Невірний запит'
    return NextResponse.json(
      { success: false, error: firstError },
      { status: 400 }
    )
  }
  const body = parseResult.data

  try {
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
        data_consent: true,
        marketing_consent: body.marketingConsent ?? false,
        promo_code: trimOrNull(body.promoCode),
        source: trimOrNull(body.source) ?? 'direct',
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
