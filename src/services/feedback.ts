import { api } from './api'
import type { ApiResponse } from '@/types'

export interface FormFeedbackPayload {
  form: string
  rating: 'up' | 'down'
  refId?: string
  comment?: string
}

export async function sendFormFeedback(
  payload: FormFeedbackPayload
): Promise<ApiResponse<{ recorded: boolean }>> {
  return api.post<ApiResponse<{ recorded: boolean }>>('/feedback/form', payload)
}
