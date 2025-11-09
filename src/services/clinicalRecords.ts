import { api } from './api'
import type { TreatmentPlan, ClinicalNote, ApiResponse } from '@/types'

const ENDPOINTS = {
  treatmentPlans: (patientId: string) =>
    `/patients/${patientId}/treatment-plans`,
  clinicalNotes: (patientId: string) => `/patients/${patientId}/clinical-notes`,
} as const

export async function getTreatmentPlans(
  patientId: string
): Promise<ApiResponse<TreatmentPlan[]>> {
  return await api.get(ENDPOINTS.treatmentPlans(patientId))
}

export async function createTreatmentPlan(
  patientId: string,
  plan: Omit<TreatmentPlan, 'id' | 'createdAt'>
): Promise<ApiResponse<TreatmentPlan>> {
  return await api.post(ENDPOINTS.treatmentPlans(patientId), plan)
}

export async function getClinicalNotes(
  patientId: string
): Promise<ApiResponse<ClinicalNote[]>> {
  return await api.get(ENDPOINTS.clinicalNotes(patientId))
}
