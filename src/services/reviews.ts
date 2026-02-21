import { api, mockAPIResponse } from './api'
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

// Fetch reviews (mocked backend)
export async function getReviews(): Promise<ApiResponse<{ items: Review[] }>> {
  try {
    return await api.get<ApiResponse<{ items: Review[] }>>('/reviews')
  } catch {
    // Mock some seed reviews
    const items: Review[] = [
      {
        id: 'r1',
        name: 'Олена',
        rating: 5,
        service: 'Професійна гігієна',
        comment: 'Дуже задоволена візитом! Все якісно і без болю.',
        wouldRecommend: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      {
        id: 'r2',
        name: 'Сергій',
        rating: 4,
        service: 'Ендодонтія',
        comment: 'Професійний підхід, все пояснили. Рекомендую.',
        wouldRecommend: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
    ]
    return mockAPIResponse({ items }, 300)
  }
}

export async function createReview(
  payload: Omit<Review, 'id' | 'createdAt'>
): Promise<ApiResponse<{ created: boolean; id: string }>> {
  try {
    return await api.post<ApiResponse<{ created: boolean; id: string }>>(
      '/reviews',
      payload
    )
  } catch {
    return mockAPIResponse({ created: true, id: `rev-${Date.now()}` }, 500)
  }
}
