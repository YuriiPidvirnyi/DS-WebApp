import { describe, it, expect, afterEach, vi } from 'vitest'
import { googleReviewUrl, normalizeReviewSrc } from '@/utils/googleReview'
import { SITE_INFO } from '@/utils/constants'

describe('googleReviewUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds the writereview URL when the Place ID is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_PLACE_ID', 'ChIJtest123')

    expect(googleReviewUrl()).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJtest123'
    )
  })

  it('falls back to the Maps share link without a Place ID', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_PLACE_ID', '')

    expect(googleReviewUrl()).toBe(SITE_INFO.googleMaps)
  })
})

describe('normalizeReviewSrc', () => {
  it('accepts known channel tags', () => {
    expect(normalizeReviewSrc('flyer')).toBe('flyer')
    expect(normalizeReviewSrc('card')).toBe('card')
    expect(normalizeReviewSrc('email')).toBe('email')
    expect(normalizeReviewSrc('reception-qr')).toBe('reception-qr')
  })

  it('rejects anything outside the whitelist pattern', () => {
    expect(normalizeReviewSrc(null)).toBe('unknown')
    expect(normalizeReviewSrc('')).toBe('unknown')
    expect(normalizeReviewSrc('has spaces')).toBe('unknown')
    expect(normalizeReviewSrc('<script>')).toBe('unknown')
    expect(normalizeReviewSrc('x'.repeat(33))).toBe('unknown')
  })

  it('lowercases mixed-case channel tags', () => {
    expect(normalizeReviewSrc('FLYER')).toBe('flyer')
  })
})
