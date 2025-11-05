import { describe, it, expect } from 'vitest'
import {
  isEmpty,
  minLength,
  maxLength,
  isValidEmail,
  isValidUkrainianPhone,
  formatUkrainianPhone,
  isValidFullName,
  validators,
  combineValidators,
} from '../validation'

describe('validation utilities', () => {
  describe('isEmpty', () => {
    it('returns true for empty strings', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
      expect(isEmpty('\t\n')).toBe(true)
    })

    it('returns false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty('  hello  ')).toBe(false)
    })
  })

  describe('minLength', () => {
    it('validates minimum length correctly', () => {
      expect(minLength('hello', 5)).toBe(true)
      expect(minLength('hello', 4)).toBe(true)
      expect(minLength('hello', 6)).toBe(false)
      expect(minLength('  hi  ', 2)).toBe(true)
    })
  })

  describe('maxLength', () => {
    it('validates maximum length correctly', () => {
      expect(maxLength('hello', 5)).toBe(true)
      expect(maxLength('hello', 6)).toBe(true)
      expect(maxLength('hello', 4)).toBe(false)
      expect(maxLength('  hi  ', 2)).toBe(true)
    })
  })

  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
    })
  })

  describe('isValidUkrainianPhone', () => {
    it('validates Ukrainian phone numbers in various formats', () => {
      // +380 format
      expect(isValidUkrainianPhone('+380501234567')).toBe(true)
      expect(isValidUkrainianPhone('+380 50 123 45 67')).toBe(true)
      expect(isValidUkrainianPhone('+380-50-123-45-67')).toBe(true)
      expect(isValidUkrainianPhone('+380 (50) 123-45-67')).toBe(true)

      // 380 format (without +)
      expect(isValidUkrainianPhone('380501234567')).toBe(true)
      expect(isValidUkrainianPhone('380 50 123 45 67')).toBe(true)

      // 0 format (local)
      expect(isValidUkrainianPhone('0501234567')).toBe(true)
      expect(isValidUkrainianPhone('050 123 45 67')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(isValidUkrainianPhone('123456789')).toBe(false)
      expect(isValidUkrainianPhone('+1234567890')).toBe(false)
      expect(isValidUkrainianPhone('380')).toBe(false)
      expect(isValidUkrainianPhone('+38050')).toBe(false)
    })
  })

  describe('formatUkrainianPhone', () => {
    it('formats phone numbers correctly', () => {
      expect(formatUkrainianPhone('0501234567')).toBe('+380 50 123 45 67')
      expect(formatUkrainianPhone('380501234567')).toBe('+380 50 123 45 67')
      expect(formatUkrainianPhone('+380501234567')).toBe('+380 50 123 45 67')
    })

    it('handles phone numbers with spaces and dashes', () => {
      expect(formatUkrainianPhone('050 123 45 67')).toBe('+380 50 123 45 67')
      expect(formatUkrainianPhone('050-123-45-67')).toBe('+380 50 123 45 67')
      expect(formatUkrainianPhone('+380 (50) 123-45-67')).toBe(
        '+380 50 123 45 67'
      )
    })

    it('returns original string if format is invalid', () => {
      expect(formatUkrainianPhone('12345')).toBe('12345')
    })
  })

  describe('isValidFullName', () => {
    it('validates full names with at least two words', () => {
      expect(isValidFullName('Іван Петренко')).toBe(true)
      expect(isValidFullName('Марія Іванівна Коваленко')).toBe(true)
      expect(isValidFullName('John Doe')).toBe(true)
    })

    it('rejects single word names', () => {
      expect(isValidFullName('Іван')).toBe(false)
      expect(isValidFullName('John')).toBe(false)
    })

    it('rejects names with words shorter than 2 characters', () => {
      expect(isValidFullName('Іван П')).toBe(false)
      expect(isValidFullName('A B')).toBe(false)
    })
  })

  describe('validators', () => {
    describe('required', () => {
      it('returns error for empty values', () => {
        expect(validators.required('')).toBeDefined()
        expect(validators.required('  ')).toBeDefined()
      })

      it('returns undefined for non-empty values', () => {
        expect(validators.required('value')).toBeUndefined()
      })

      it('uses custom field name in error message', () => {
        const error = validators.required('', "Ім'я")
        expect(error).toContain("Ім'я")
      })
    })

    describe('email', () => {
      it('returns error for invalid emails', () => {
        expect(validators.email('invalid')).toBeDefined()
      })

      it('returns undefined for valid emails', () => {
        expect(validators.email('test@example.com')).toBeUndefined()
      })

      it('returns undefined for empty values', () => {
        expect(validators.email('')).toBeUndefined()
      })
    })

    describe('phone', () => {
      it('returns error for invalid phone numbers', () => {
        expect(validators.phone('123')).toBeDefined()
      })

      it('returns undefined for valid phone numbers', () => {
        expect(validators.phone('+380501234567')).toBeUndefined()
      })

      it('returns undefined for empty values', () => {
        expect(validators.phone('')).toBeUndefined()
      })
    })

    describe('fullName', () => {
      it('returns error for single word names', () => {
        expect(validators.fullName('Іван')).toBeDefined()
      })

      it('returns undefined for valid full names', () => {
        expect(validators.fullName('Іван Петренко')).toBeUndefined()
      })
    })

    describe('minLength', () => {
      it('returns error for short strings', () => {
        const validator = validators.minLength(5)
        expect(validator('abc')).toBeDefined()
      })

      it('returns undefined for strings meeting minimum length', () => {
        const validator = validators.minLength(5)
        expect(validator('hello')).toBeUndefined()
      })
    })

    describe('maxLength', () => {
      it('returns error for long strings', () => {
        const validator = validators.maxLength(5)
        expect(validator('too long')).toBeDefined()
      })

      it('returns undefined for strings within maximum length', () => {
        const validator = validators.maxLength(5)
        expect(validator('hi')).toBeUndefined()
      })
    })
  })

  describe('combineValidators', () => {
    it('returns first error from multiple validators', () => {
      const validate = combineValidators(validators.required, validators.email)

      expect(validate('')).toBeDefined()
      expect(validate('invalid')).toBeDefined()
      expect(validate('test@example.com')).toBeUndefined()
    })

    it('stops at first error', () => {
      let secondValidatorCalled = false
      const firstValidator = () => 'First error'
      const secondValidator = () => {
        secondValidatorCalled = true
        return undefined
      }

      const validate = combineValidators(firstValidator, secondValidator)
      validate('test')

      expect(secondValidatorCalled).toBe(false)
    })

    it('returns undefined when all validators pass', () => {
      const validate = combineValidators(
        val => (val.length >= 2 ? undefined : 'Too short'),
        val => (val.length <= 10 ? undefined : 'Too long')
      )

      expect(validate('hello')).toBeUndefined()
    })
  })
})
