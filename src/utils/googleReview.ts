import { SITE_INFO } from '@/utils/constants'

/**
 * Direct "write a review" URL for the clinic's Google Business Profile.
 * Requires NEXT_PUBLIC_GOOGLE_PLACE_ID (Place ID Finder / GBP "Ask for
 * reviews"). Falls back to the plain Maps share link until the ID is set,
 * so printed QR codes never dead-end.
 */
export function googleReviewUrl(): string {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
  }
  return SITE_INFO.googleMaps
}

/** Allowed channel tags for /r/google?src=… (anything else is logged as 'unknown'). */
export const REVIEW_SRC_PATTERN = /^[a-z0-9_-]{1,32}$/

export function normalizeReviewSrc(raw: string | null): string {
  const value = (raw ?? '').toLowerCase()
  return REVIEW_SRC_PATTERN.test(value) ? value : 'unknown'
}
