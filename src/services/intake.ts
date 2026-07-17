import type { ApiResponse } from '@/types'
import { api } from './api'

const ENDPOINTS = {
  create: '/intake',
} as const

export type IntakeAnswerValue = '' | 'yes' | 'no' | string | number | null

export interface IntakeRequest {
  firstName: string
  lastName: string
  patronymic?: string
  phone: string
  email?: string
  dateOfBirth?: string
  allergies?: string
  medications?: string
  chronicConditions?: string
  pregnancy?: '' | 'no' | 'yes'
  complaints?: string
  dataConsent: boolean
  marketingConsent: boolean
  promoCode?: string
  source?: string
  /** 'basic' (short promo form) | 'adult' | 'child' — full clinic анкети */
  formType?: 'basic' | 'adult' | 'child'
  /** Structured answers keyed by intake-form-definitions field ids */
  answers?: Record<string, IntakeAnswerValue>
  cf_turnstile_response?: string
}

export async function createIntake(
  payload: IntakeRequest
): Promise<ApiResponse<{ id: string }>> {
  return api.post<ApiResponse<{ id: string }>>(ENDPOINTS.create, payload)
}
