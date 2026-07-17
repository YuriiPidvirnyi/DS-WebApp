import type { ApiResponse } from '@/types'
import { api } from './api'

/**
 * Request a password-reset email. Routes through our own /api/auth/recover
 * (custom Resend email → click-gated /auth/confirm) instead of Supabase's
 * default recovery mail, so an email-preview scanner can't burn the one-time
 * token before the patient clicks. Always resolves success-shaped for a
 * well-formed email (anti-enumeration is enforced server-side).
 */
export async function requestPasswordReset(
  email: string,
  locale?: 'uk' | 'en' | 'pl'
): Promise<ApiResponse<Record<string, never>>> {
  return api.post<ApiResponse<Record<string, never>>>('/auth/recover', {
    email,
    locale,
  })
}
