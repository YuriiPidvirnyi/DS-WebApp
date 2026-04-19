import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ReviewStats {
  rating: number
  reviewCount: number
}

const FALLBACK: ReviewStats = { rating: 4.7, reviewCount: 71 }

async function fetchReviewStats(): Promise<ReviewStats> {
  const supabase = await createClient()
  if (!supabase) return FALLBACK

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('status', 'approved')

  if (error || !data || data.length === 0) return FALLBACK

  const avg =
    data.reduce((sum, r) => sum + (r.rating as number), 0) / data.length

  return {
    rating: Math.round(avg * 10) / 10,
    reviewCount: data.length,
  }
}

// Cache for 1 hour — avoids a DB round-trip on every request
export const getReviewStats = unstable_cache(
  fetchReviewStats,
  ['review-stats'],
  {
    revalidate: 3600,
    tags: ['review-stats'],
  }
)
