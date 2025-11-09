import { api } from './api'
import type {
  PaymentMethod,
  PaymentPlan,
  InsuranceClaim,
  ApiResponse,
} from '@/types'

const ENDPOINTS = {
  paymentMethods: (patientId: string) =>
    `/patients/${patientId}/payment-methods`,
  paymentPlans: (patientId: string) => `/patients/${patientId}/payment-plans`,
  processPayment: '/payments/process',
} as const

export async function getPaymentMethods(
  patientId: string
): Promise<ApiResponse<PaymentMethod[]>> {
  return await api.get(ENDPOINTS.paymentMethods(patientId))
}

export async function addPaymentMethod(
  patientId: string,
  method: Omit<PaymentMethod, 'id'>
): Promise<ApiResponse<PaymentMethod>> {
  return await api.post(ENDPOINTS.paymentMethods(patientId), method)
}

export async function deletePaymentMethod(
  patientId: string,
  methodId: string
): Promise<ApiResponse<void>> {
  return await api.delete(`${ENDPOINTS.paymentMethods(patientId)}/${methodId}`)
}

export async function processPayment(data: {
  patientId: string
  amount: number
  paymentMethodId: string
  description: string
}): Promise<ApiResponse<{ transactionId: string; status: string }>> {
  return await api.post(ENDPOINTS.processPayment, data)
}

export async function getPaymentPlans(
  patientId: string
): Promise<ApiResponse<PaymentPlan[]>> {
  return await api.get(ENDPOINTS.paymentPlans(patientId))
}

export async function getInsuranceClaims(
  patientId: string
): Promise<ApiResponse<InsuranceClaim[]>> {
  return await api.get(`/patients/${patientId}/claims`)
}
