import { describe, expect, it } from 'vitest'
import { isSafeInternalPath } from './security'

describe('isSafeInternalPath', () => {
  it('accepts absolute in-app paths', () => {
    expect(isSafeInternalPath('/cabinet')).toBe(true)
    expect(isSafeInternalPath('/auth/reset-password')).toBe(true)
    expect(isSafeInternalPath('/a?b=c#d')).toBe(true)
  })

  it('rejects empty / null / relative', () => {
    expect(isSafeInternalPath(null)).toBe(false)
    expect(isSafeInternalPath(undefined)).toBe(false)
    expect(isSafeInternalPath('')).toBe(false)
    expect(isSafeInternalPath('cabinet')).toBe(false)
  })

  it('rejects cross-origin open-redirect forms', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false)
    expect(isSafeInternalPath('/\\evil.com')).toBe(false)
    expect(isSafeInternalPath('/%5Cevil.com')).toBe(false)
    expect(isSafeInternalPath('/%5cevil.com')).toBe(false) // lowercase encoded
    expect(isSafeInternalPath('/%2f%2fevil.com')).toBe(false) // encoded //
    expect(isSafeInternalPath('https://evil.com')).toBe(false)
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false)
  })

  it('rejects control-character bypasses', () => {
    expect(isSafeInternalPath('/\t/evil.com')).toBe(false)
    expect(isSafeInternalPath('/\n/evil.com')).toBe(false)
    expect(isSafeInternalPath('\t//evil.com')).toBe(false)
  })
})
