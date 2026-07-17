import type { ApiResponse } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  redemptions: '/promo/redemptions',
} as const

export interface PromoRedemption {
  id: string
  redeemed_at: string
}

/** Records the welcome-pack gift handout for a submitted intake form. */
export async function redeemWelcomeGift(
  intakeFormId: string
): Promise<ApiResponse<PromoRedemption>> {
  return api.post<ApiResponse<PromoRedemption>>(ENDPOINTS.redemptions, {
    intakeFormId,
  })
}
