import { api } from './api'
import type { PatientMessage, AutomatedCampaign, ApiResponse } from '@/types'

const ENDPOINTS = {
  messages: '/messages',
  send: '/messages/send',
  campaigns: '/campaigns',
} as const

export async function getPatientMessages(
  patientId: string
): Promise<ApiResponse<PatientMessage[]>> {
  return await api.get(`${ENDPOINTS.messages}?patientId=${patientId}`)
}

export async function sendMessage(
  message: Omit<PatientMessage, 'id' | 'sentAt'>
): Promise<ApiResponse<PatientMessage>> {
  return await api.post(ENDPOINTS.send, message)
}

export async function getCampaigns(): Promise<
  ApiResponse<AutomatedCampaign[]>
> {
  return await api.get(ENDPOINTS.campaigns)
}
