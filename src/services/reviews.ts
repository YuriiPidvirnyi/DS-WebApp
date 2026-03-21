import { api } from './api'
import type { ApiResponse } from '@/types'

export type Review = {
  id: string
  name: string
  email?: string
  rating: number
  service: string
  doctor?: string
  comment: string
  visitDate?: string
  wouldRecommend: boolean
  createdAt: string
}

/** Fetch approved reviews from the API */
export async function getReviews(): Promise<ApiResponse<{ items: Review[] }>> {
  return api.get<ApiResponse<{ items: Review[] }>>('/reviews')
}

/** Submit a new review (pending moderation) */
export async function createReview(
  payload: Omit<Review, 'id' | 'createdAt'>
): Promise<ApiResponse<{ created: boolean; id: string }>> {
  return api.post<ApiResponse<{ created: boolean; id: string }>>(
    '/reviews',
    payload
  )
}
