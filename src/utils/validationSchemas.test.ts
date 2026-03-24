import { describe, it, expect } from 'vitest'
import { contactFormSchema } from './validationSchemas'

describe('contactFormSchema', () => {
  const validData = {
    name: 'Олена',
    email: 'olena@example.com',
    phone: '+380501234567',
    message: 'Хочу записатися на прийом до стоматолога',
    consent: true,
  }

  it('accepts valid contact form data', () => {
    const result = contactFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = contactFormSchema.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone format', () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      phone: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid Ukrainian phone', () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      phone: '+380671234567',
    })
    expect(result.success).toBe(true)
  })

  it('rejects message shorter than 10 chars', () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      message: 'Short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when consent is false', () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      consent: false,
    })
    expect(result.success).toBe(false)
  })
})
