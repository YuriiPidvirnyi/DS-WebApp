import { api } from './api'
import type { ApiResponse } from '@/types'

export type Doctor = {
  id: string
  fullName: string
  shortName: string
  firstName: string
  lastName: string
  patronymic?: string
  specialization: string
  experience: number // years
  education: string
  bio?: string
  photo?: string
}

/** Fetch active doctors ordered by experience */
export async function getDoctors(): Promise<ApiResponse<Doctor[]>> {
  return api.get<ApiResponse<Doctor[]>>('/doctors', {
    signal: AbortSignal.timeout(10_000),
  })
}
