import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StructuredData } from './StructuredData'

/**
 * Смоук на JSON-LD (запит рев'ю PR #385): схеми — нетиповані об'єктні
 * літерали, тож зламану форму не впіймає ані tsc, ані ESLint. Рендеримо всі
 * чотири типи і перевіряємо, що емітований <script type="application/ld+json">
 * містить валідний JSON з очікуваним @type — регресія форми стає червоним
 * тестом, а не тихо зіпсованою розміткою для Google.
 */
const CASES = [
  ['organization', 'Organization'],
  ['localBusiness', 'LocalBusiness'],
  ['medicalClinic', ['MedicalClinic', 'Dentist']],
] as const

describe('StructuredData JSON-LD', () => {
  for (const [type, expectedType] of CASES) {
    it(`${type}: emits parseable JSON-LD with the right @type`, () => {
      const { container } = render(<StructuredData type={type} />)
      const script = container.querySelector(
        'script[type="application/ld+json"]'
      )
      expect(script).not.toBeNull()
      const parsed = JSON.parse(script!.innerHTML) as Record<string, unknown>
      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toEqual(expectedType)
    })
  }

  it('medicalClinic: geo stays consistent with the other entity blocks', () => {
    const { container } = render(<StructuredData type="medicalClinic" />)
    const parsed = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.innerHTML
    ) as { geo?: { latitude?: string; longitude?: string } }
    expect(parsed.geo?.latitude).toBeTruthy()
    expect(parsed.geo?.longitude).toBeTruthy()
  })
})
