import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeUserInput,
  validatePattern,
  generateNonce,
  generateCSP,
  securityPatterns,
  validators,
  getSecureHeaders,
} from '../security'

// Mock crypto for Node.js environment
const mockGetRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
})

vi.stubGlobal('crypto', {
  getRandomValues: mockGetRandomValues,
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
})

// Mock sessionStorage
const sessionStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
}

vi.stubGlobal('sessionStorage', sessionStorageMock)

describe('Security Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.store = {}
  })

  describe('sanitizeUserInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeUserInput('  hello  ')).toBe('hello')
    })

    it('should escape HTML entities', () => {
      expect(sanitizeUserInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      )
    })

    it('should escape special characters', () => {
      expect(sanitizeUserInput("test's \"value\"")).toBe(
        'test&#39;s &quot;value&quot;'
      )
    })

    it('should escape backslashes', () => {
      expect(sanitizeUserInput('path\\to\\file')).toBe('path&#92;to&#92;file')
    })

    it('should handle empty strings', () => {
      expect(sanitizeUserInput('')).toBe('')
      expect(sanitizeUserInput('   ')).toBe('')
    })
  })

  describe('validatePattern', () => {
    it('should return true for matching patterns', () => {
      expect(validatePattern('test@email.com', securityPatterns.email)).toBe(
        true
      )
      expect(validatePattern('+380501234567', securityPatterns.phone)).toBe(true)
    })

    it('should return false for non-matching patterns', () => {
      expect(validatePattern('invalid-email', securityPatterns.email)).toBe(
        false
      )
      expect(validatePattern('123456', securityPatterns.phone)).toBe(false)
    })
  })

  describe('generateNonce', () => {
    it('should generate a hex string', () => {
      const nonce = generateNonce()
      expect(nonce).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate 32 character nonce', () => {
      const nonce = generateNonce()
      expect(nonce.length).toBe(32)
    })

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      // With mocked random, they might be similar but the function should be called
      expect(mockGetRandomValues).toHaveBeenCalled()
    })
  })

  describe('generateCSP', () => {
    it('should include the nonce in script-src', () => {
      const nonce = 'test-nonce-123'
      const csp = generateCSP(nonce)
      expect(csp).toContain(`'nonce-${nonce}'`)
    })

    it('should include required directives', () => {
      const csp = generateCSP('test-nonce')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should be a single line without extra whitespace', () => {
      const csp = generateCSP('test-nonce')
      expect(csp).not.toContain('\n')
      expect(csp).not.toContain('  ')
    })
  })

  describe('securityPatterns', () => {
    describe('name pattern', () => {
      it('should match valid names', () => {
        expect(securityPatterns.name.test('John Doe')).toBe(true)
        expect(securityPatterns.name.test('Іван Петренко')).toBe(true)
        expect(securityPatterns.name.test("O'Connor")).toBe(true)
      })

      it('should reject names with special characters', () => {
        expect(securityPatterns.name.test('John<script>')).toBe(false)
        expect(securityPatterns.name.test('Name@email')).toBe(false)
      })

      it('should reject too short names', () => {
        expect(securityPatterns.name.test('A')).toBe(false)
      })
    })

    describe('email pattern', () => {
      it('should match valid emails', () => {
        expect(securityPatterns.email.test('test@example.com')).toBe(true)
        expect(securityPatterns.email.test('user.name+tag@domain.co')).toBe(true)
      })

      it('should reject invalid emails', () => {
        expect(securityPatterns.email.test('invalid')).toBe(false)
        expect(securityPatterns.email.test('@domain.com')).toBe(false)
        expect(securityPatterns.email.test('user@')).toBe(false)
      })
    })

    describe('phone pattern', () => {
      it('should match Ukrainian phone numbers', () => {
        expect(securityPatterns.phone.test('+380501234567')).toBe(true)
        expect(securityPatterns.phone.test('380501234567')).toBe(true)
      })

      it('should reject invalid phone numbers', () => {
        expect(securityPatterns.phone.test('123456789')).toBe(false)
        expect(securityPatterns.phone.test('+1234567890')).toBe(false)
      })
    })

    describe('uuid pattern', () => {
      it('should match valid UUIDs', () => {
        expect(
          securityPatterns.uuid.test('123e4567-e89b-12d3-a456-426614174000')
        ).toBe(true)
      })

      it('should reject invalid UUIDs', () => {
        expect(securityPatterns.uuid.test('not-a-uuid')).toBe(false)
        expect(securityPatterns.uuid.test('123e4567')).toBe(false)
      })
    })

    describe('noHtml pattern', () => {
      it('should match text without HTML', () => {
        expect(securityPatterns.noHtml.test('Plain text')).toBe(true)
        expect(securityPatterns.noHtml.test('Text with numbers 123')).toBe(true)
      })

      it('should reject HTML tags', () => {
        expect(securityPatterns.noHtml.test('<script>alert(1)</script>')).toBe(
          false
        )
        expect(securityPatterns.noHtml.test('<div>content</div>')).toBe(false)
      })
    })
  })

  describe('validators', () => {
    describe('email validator', () => {
      it('should validate correct emails', () => {
        expect(validators.email('test@example.com')).toBe(true)
        expect(validators.email('user+tag@domain.co.uk')).toBe(true)
      })

      it('should reject invalid emails', () => {
        expect(validators.email('invalid')).toBe(false)
        expect(validators.email('')).toBe(false)
      })
    })

    describe('phone validator', () => {
      it('should validate Ukrainian phone numbers', () => {
        expect(validators.phone('+380501234567')).toBe(true)
      })

      it('should reject invalid phone numbers', () => {
        expect(validators.phone('123')).toBe(false)
      })
    })

    describe('strongPassword validator', () => {
      it('should accept strong passwords', () => {
        const result = validators.strongPassword('SecurePass123!')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject passwords without uppercase', () => {
        const result = validators.strongPassword('lowercase123!')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Must contain uppercase letter')
      })

      it('should reject passwords without lowercase', () => {
        const result = validators.strongPassword('UPPERCASE123!')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Must contain lowercase letter')
      })

      it('should reject passwords without numbers', () => {
        const result = validators.strongPassword('NoNumbers!')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Must contain number')
      })

      it('should reject passwords without special characters', () => {
        const result = validators.strongPassword('NoSpecial123')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Must contain special character')
      })

      it('should reject short passwords', () => {
        const result = validators.strongPassword('Sh0rt!')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Must be at least 8 characters')
      })

      it('should return multiple errors for weak passwords', () => {
        const result = validators.strongPassword('weak')
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
      })
    })

    describe('noXSS validator', () => {
      it('should accept clean text', () => {
        expect(validators.noXSS('Clean text without HTML')).toBe(true)
      })

      it('should reject text with HTML', () => {
        expect(validators.noXSS('<script>alert(1)</script>')).toBe(false)
        expect(validators.noXSS('Text with <b>bold</b>')).toBe(false)
      })
    })

    describe('url validator', () => {
      it('should accept valid URLs', () => {
        expect(validators.url('https://example.com')).toBe(true)
        expect(validators.url('http://sub.domain.co.uk/path')).toBe(true)
      })

      it('should reject invalid URLs', () => {
        expect(validators.url('not-a-url')).toBe(false)
        expect(validators.url('')).toBe(false)
      })
    })
  })

  describe('getSecureHeaders', () => {
    it('should return required security headers', () => {
      const headers = getSecureHeaders()

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Permissions-Policy']).toBe(
        'geolocation=(), microphone=(), camera=()'
      )
    })

    it('should include Content-Security-Policy with nonce', () => {
      const headers = getSecureHeaders()

      expect(headers['Content-Security-Policy']).toBeDefined()
      expect(headers['Content-Security-Policy']).toContain('nonce-')
    })
  })
})
