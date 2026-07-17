import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import {
  checkRateLimit,
  csrfErrorResponse,
  rateLimitResponse,
  validateCSRF,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CAMPAIGN = 'welcome_pack'

const redeemSchema = z.object({
  intakeFormId: z.string().uuid('Невірний ідентифікатор анкети'),
})

/**
 * POST /api/promo/redemptions
 *
 * Records a welcome-pack gift handed out at reception for a submitted intake
 * questionnaire. DB uniqueness gives one gift per questionnaire and one per
 * known patient; a second attempt returns 409 so the UI can say "already
 * given". The gift is tied to the questionnaire, never to a review.
 */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess || !hasPermission(adminAccess.role, 'promo:redeem')) {
    return NextResponse.json(
      { success: false, error: 'Недостатньо прав доступу' },
      { status: 403 }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const parseResult = redeemSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Невірний ідентифікатор анкети' },
      { status: 400 }
    )
  }
  const { intakeFormId } = parseResult.data

  try {
    const { data: intake, error: intakeError } = await supabase
      .from('patient_intake_forms')
      .select('id, patient_id')
      .eq('id', intakeFormId)
      .maybeSingle()

    if (intakeError) throw intakeError
    if (!intake) {
      return NextResponse.json(
        { success: false, error: 'Анкету не знайдено' },
        { status: 404 }
      )
    }

    const { data: redemption, error: insertError } = await supabase
      .from('promo_redemptions')
      .insert({
        campaign_slug: CAMPAIGN,
        intake_form_id: intake.id,
        patient_id: intake.patient_id,
        redeemed_by: user.id,
      })
      .select('id, redeemed_at')
      .single()

    if (insertError) {
      // 23505 = unique violation → gift already given for this form/patient
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'already_redeemed' },
          { status: 409 }
        )
      }
      throw insertError
    }

    return NextResponse.json(
      { success: true, data: redemption },
      { status: 201 }
    )
  } catch (error) {
    captureException(
      error instanceof Error
        ? error
        : new Error('[promo/redemptions] unexpected error')
    )
    return NextResponse.json(
      { success: false, error: 'Не вдалося зафіксувати видачу подарунка' },
      { status: 500 }
    )
  }
}
