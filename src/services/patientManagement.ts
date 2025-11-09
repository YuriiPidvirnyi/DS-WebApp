/**
 * Patient Management Service
 * Comprehensive patient CRUD operations, search, and filtering
 */

import { api } from './api'
import type {
  EnhancedPatient,
  ApiResponse,
  EmergencyContact,
  ConsentRecord,
  PatientTag,
  CommunicationPreferences,
} from '@/types'

const ENDPOINTS = {
  patients: '/patients',
  patient: (id: string) => `/patients/${id}`,
  search: '/patients/search',
  tags: '/patients/tags',
  emergencyContacts: (patientId: string) =>
    `/patients/${patientId}/emergency-contacts`,
  consents: (patientId: string) => `/patients/${patientId}/consents`,
  family: (patientId: string) => `/patients/${patientId}/family`,
  preferences: (patientId: string) => `/patients/${patientId}/preferences`,
} as const

/**
 * Get patient by ID
 */
export async function getPatient(
  id: string
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.get<ApiResponse<EnhancedPatient>>(ENDPOINTS.patient(id))
  } catch (error) {
    console.error('Failed to get patient:', error)
    throw error
  }
}

/**
 * Get all patients with pagination
 */
export async function getPatients(params?: {
  page?: number
  limit?: number
  status?: EnhancedPatient['status']
  tags?: string[]
}): Promise<ApiResponse<{ patients: EnhancedPatient[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.status) queryParams.set('status', params.status)
    if (params?.tags) queryParams.set('tags', params.tags.join(','))

    const endpoint = `${ENDPOINTS.patients}?${queryParams.toString()}`
    return await api.get<
      ApiResponse<{ patients: EnhancedPatient[]; total: number }>
    >(endpoint)
  } catch (error) {
    console.error('Failed to get patients:', error)
    throw error
  }
}

/**
 * Search patients
 */
export async function searchPatients(query: {
  term?: string
  phone?: string
  email?: string
  dateOfBirth?: string
  insuranceProvider?: string
}): Promise<ApiResponse<EnhancedPatient[]>> {
  try {
    return await api.post<ApiResponse<EnhancedPatient[]>>(
      ENDPOINTS.search,
      query
    )
  } catch (error) {
    console.error('Failed to search patients:', error)
    throw error
  }
}

/**
 * Create new patient
 */
export async function createPatient(
  patient: Partial<EnhancedPatient>
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.post<ApiResponse<EnhancedPatient>>(
      ENDPOINTS.patients,
      patient
    )
  } catch (error) {
    console.error('Failed to create patient:', error)
    throw error
  }
}

/**
 * Update existing patient
 */
export async function updatePatient(
  id: string,
  updates: Partial<EnhancedPatient>
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.patch<ApiResponse<EnhancedPatient>>(
      ENDPOINTS.patient(id),
      updates
    )
  } catch (error) {
    console.error('Failed to update patient:', error)
    throw error
  }
}

/**
 * Delete/Archive patient
 */
export async function archivePatient(id: string): Promise<ApiResponse<void>> {
  try {
    return await api.patch<ApiResponse<void>>(ENDPOINTS.patient(id), {
      status: 'archived',
    })
  } catch (error) {
    console.error('Failed to archive patient:', error)
    throw error
  }
}

/**
 * Emergency Contacts Management
 */
export async function getEmergencyContacts(
  patientId: string
): Promise<ApiResponse<EmergencyContact[]>> {
  try {
    return await api.get<ApiResponse<EmergencyContact[]>>(
      ENDPOINTS.emergencyContacts(patientId)
    )
  } catch (error) {
    console.error('Failed to get emergency contacts:', error)
    throw error
  }
}

export async function addEmergencyContact(
  patientId: string,
  contact: Omit<EmergencyContact, 'id'>
): Promise<ApiResponse<EmergencyContact>> {
  try {
    return await api.post<ApiResponse<EmergencyContact>>(
      ENDPOINTS.emergencyContacts(patientId),
      contact
    )
  } catch (error) {
    console.error('Failed to add emergency contact:', error)
    throw error
  }
}

export async function updateEmergencyContact(
  patientId: string,
  contactId: string,
  updates: Partial<EmergencyContact>
): Promise<ApiResponse<EmergencyContact>> {
  try {
    return await api.patch<ApiResponse<EmergencyContact>>(
      `${ENDPOINTS.emergencyContacts(patientId)}/${contactId}`,
      updates
    )
  } catch (error) {
    console.error('Failed to update emergency contact:', error)
    throw error
  }
}

export async function deleteEmergencyContact(
  patientId: string,
  contactId: string
): Promise<ApiResponse<void>> {
  try {
    return await api.delete<ApiResponse<void>>(
      `${ENDPOINTS.emergencyContacts(patientId)}/${contactId}`
    )
  } catch (error) {
    console.error('Failed to delete emergency contact:', error)
    throw error
  }
}

/**
 * Consent Management
 */
export async function getConsents(
  patientId: string
): Promise<ApiResponse<ConsentRecord[]>> {
  try {
    return await api.get<ApiResponse<ConsentRecord[]>>(
      ENDPOINTS.consents(patientId)
    )
  } catch (error) {
    console.error('Failed to get consents:', error)
    throw error
  }
}

export async function addConsent(
  patientId: string,
  consent: Omit<ConsentRecord, 'id'>
): Promise<ApiResponse<ConsentRecord>> {
  try {
    return await api.post<ApiResponse<ConsentRecord>>(
      ENDPOINTS.consents(patientId),
      consent
    )
  } catch (error) {
    console.error('Failed to add consent:', error)
    throw error
  }
}

/**
 * Tags Management
 */
export async function getPatientTags(): Promise<ApiResponse<PatientTag[]>> {
  try {
    return await api.get<ApiResponse<PatientTag[]>>(ENDPOINTS.tags)
  } catch (error) {
    console.error('Failed to get tags:', error)
    throw error
  }
}

export async function addPatientTag(
  patientId: string,
  tag: PatientTag
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.post<ApiResponse<EnhancedPatient>>(
      `${ENDPOINTS.patient(patientId)}/tags`,
      tag
    )
  } catch (error) {
    console.error('Failed to add tag:', error)
    throw error
  }
}

export async function removePatientTag(
  patientId: string,
  tagId: string
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.delete<ApiResponse<EnhancedPatient>>(
      `${ENDPOINTS.patient(patientId)}/tags/${tagId}`
    )
  } catch (error) {
    console.error('Failed to remove tag:', error)
    throw error
  }
}

/**
 * Family Account Management
 */
export async function linkFamilyMembers(
  accountHolderId: string,
  memberIds: string[]
): Promise<ApiResponse<EnhancedPatient[]>> {
  try {
    return await api.post<ApiResponse<EnhancedPatient[]>>(
      ENDPOINTS.family(accountHolderId),
      { memberIds }
    )
  } catch (error) {
    console.error('Failed to link family members:', error)
    throw error
  }
}

export async function getFamilyMembers(
  patientId: string
): Promise<ApiResponse<EnhancedPatient[]>> {
  try {
    return await api.get<ApiResponse<EnhancedPatient[]>>(
      ENDPOINTS.family(patientId)
    )
  } catch (error) {
    console.error('Failed to get family members:', error)
    throw error
  }
}

/**
 * Communication Preferences
 */
export async function updateCommunicationPreferences(
  patientId: string,
  preferences: CommunicationPreferences
): Promise<ApiResponse<EnhancedPatient>> {
  try {
    return await api.patch<ApiResponse<EnhancedPatient>>(
      ENDPOINTS.preferences(patientId),
      preferences
    )
  } catch (error) {
    console.error('Failed to update preferences:', error)
    throw error
  }
}

/**
 * Patient Statistics
 */
export async function getPatientStats(patientId: string): Promise<
  ApiResponse<{
    totalVisits: number
    missedAppointments: number
    completedTreatments: number
    outstandingBalance: number
    lifetimeValue: number
    lastVisit?: Date
    nextAppointment?: Date
  }>
> {
  try {
    return await api.get<
      ApiResponse<{
        totalVisits: number
        missedAppointments: number
        completedTreatments: number
        outstandingBalance: number
        lifetimeValue: number
        lastVisit?: Date
        nextAppointment?: Date
      }>
    >(`${ENDPOINTS.patient(patientId)}/stats`)
  } catch (error) {
    console.error('Failed to get patient stats:', error)
    throw error
  }
}
