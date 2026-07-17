import { describe, expect, it } from 'vitest'
import { sanitizeUrlForAnalytics } from './analytics'

describe('sanitizeUrlForAnalytics', () => {
  it('strips one-time auth tokens/codes from the query', () => {
    const out = sanitizeUrlForAnalytics(
      'https://app.example.com/auth/confirm?token_hash=SECRET&type=recovery&next=/x'
    )
    expect(out).not.toContain('SECRET')
    expect(out).not.toContain('token_hash')
    expect(out).toContain('type=recovery')
    expect(out).toContain('next=%2Fx')
  })

  it('strips code / access_token / refresh_token', () => {
    expect(sanitizeUrlForAnalytics('https://a.com/?code=abc')).not.toContain(
      'abc'
    )
    const hash = sanitizeUrlForAnalytics(
      'https://a.com/auth/callback#access_token=AA&refresh_token=BB&type=recovery'
    )
    expect(hash).not.toContain('AA')
    expect(hash).not.toContain('BB')
    expect(hash).toContain('type=recovery')
  })

  it('leaves clean URLs unchanged', () => {
    expect(sanitizeUrlForAnalytics('https://a.com/services?x=1')).toBe(
      'https://a.com/services?x=1'
    )
  })
})
