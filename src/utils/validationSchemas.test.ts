import { describe, it, expect } from 'vitest'
import { contactFormSchema, intakeFormSchema } from './validationSchemas'

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

describe('intakeFormSchema', () => {
  const validData = {
    lastName: 'Шевченко',
    firstName: 'Тарас',
    patronymic: '',
    phone: '+380671234567',
    email: '',
    dateOfBirth: '',
    allergies: '',
    medications: '',
    chronicConditions: '',
    pregnancy: '' as const,
    complaints: '',
    dataConsent: true,
    marketingConsent: false,
  }

  it('accepts a minimal valid intake', () => {
    expect(intakeFormSchema.safeParse(validData).success).toBe(true)
  })

  it('accepts a full intake with medical history', () => {
    const result = intakeFormSchema.safeParse({
      ...validData,
      patronymic: 'Григорович',
      email: 'taras@example.com',
      dateOfBirth: '1990-03-09',
      allergies: 'лідокаїн',
      medications: 'вітамін D',
      chronicConditions: 'гіпертонія',
      pregnancy: 'no',
      complaints: 'Болить зуб праворуч зверху',
      marketingConsent: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects when data consent is not given', () => {
    const result = intakeFormSchema.safeParse({
      ...validData,
      dataConsent: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone', () => {
    expect(
      intakeFormSchema.safeParse({ ...validData, phone: '067123' }).success
    ).toBe(false)
  })

  it('rejects names with digits', () => {
    expect(
      intakeFormSchema.safeParse({ ...validData, firstName: 'Tara5' }).success
    ).toBe(false)
  })

  it('rejects an unknown pregnancy value', () => {
    expect(
      intakeFormSchema.safeParse({ ...validData, pregnancy: 'maybe' }).success
    ).toBe(false)
  })

  it('rejects an implausible date of birth', () => {
    expect(
      intakeFormSchema.safeParse({ ...validData, dateOfBirth: '1830-01-01' })
        .success
    ).toBe(false)
  })
})
