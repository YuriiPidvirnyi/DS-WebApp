import { describe, it, expect } from 'vitest'
import { localizedServiceName } from './serviceName'

const svc = {
  name_uk: 'Пломба',
  name_en: 'Filling',
  name_pl: 'Wypełnienie',
}

describe('localizedServiceName', () => {
  it('returns the language-matched name', () => {
    expect(localizedServiceName(svc, 'uk')).toBe('Пломба')
    expect(localizedServiceName(svc, 'en')).toBe('Filling')
    expect(localizedServiceName(svc, 'pl')).toBe('Wypełnienie')
  })

  it('handles region-suffixed language tags (en-US, pl-PL)', () => {
    expect(localizedServiceName(svc, 'en-US')).toBe('Filling')
    expect(localizedServiceName(svc, 'pl-PL')).toBe('Wypełnienie')
  })

  it('falls back to the Ukrainian name when the translation is missing/empty', () => {
    expect(localizedServiceName({ name_uk: 'Пломба' }, 'en')).toBe('Пломба')
    expect(
      localizedServiceName({ name_uk: 'Пломба', name_en: '   ' }, 'en')
    ).toBe('Пломба')
    expect(
      localizedServiceName({ name_uk: 'Пломба', name_pl: null }, 'pl')
    ).toBe('Пломба')
  })

  it('trims surrounding whitespace', () => {
    expect(
      localizedServiceName({ name_uk: 'Пломба', name_en: '  Filling  ' }, 'en')
    ).toBe('Filling')
  })

  it('returns the fallback when the service is null/undefined', () => {
    expect(localizedServiceName(null, 'uk')).toBe('—')
    expect(localizedServiceName(undefined, 'en')).toBe('—')
    expect(localizedServiceName(null, 'uk', 'n/a')).toBe('n/a')
  })

  it('returns the fallback when even the Ukrainian name is empty', () => {
    expect(localizedServiceName({ name_uk: '' }, 'uk')).toBe('—')
    expect(localizedServiceName({ name_uk: '   ' }, 'en', 'n/a')).toBe('n/a')
  })
})
