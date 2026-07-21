import { describe, it, expect } from 'vitest'
import { beforeAfterCases } from '@/components/BeforeAfterGallery'
import uk from '@/locales/uk.json'
import en from '@/locales/en.json'
import pl from '@/locales/pl.json'

/**
 * The before/after slider builds its i18n keys from the case id, so the
 * static-literal key guards can't see them — a case added to the component
 * without matching locale entries would render raw keys. This iterates the
 * exported case array and asserts every key resolves in uk/en/pl.
 */
function has(dict: unknown, dotted: string): boolean {
  return (
    dotted.split('.').reduce<unknown>((node, part) => {
      if (node && typeof node === 'object' && part in (node as object)) {
        return (node as Record<string, unknown>)[part]
      }
      return undefined
    }, dict) !== undefined
  )
}

describe('before/after cases — every i18n key resolves in every locale', () => {
  const locales = { uk, en, pl } as const

  it('has the expected seven cases', () => {
    expect(beforeAfterCases).toHaveLength(7)
  })

  for (const c of beforeAfterCases) {
    const keys = [c.titleKey, c.descriptionKey, c.treatmentKey, c.durationKey]
    for (const key of keys) {
      for (const [lang, dict] of Object.entries(locales)) {
        it(`case ${c.id}: ${key} exists in ${lang}`, () => {
          expect(has(dict, key), `${key} missing from ${lang}.json`).toBe(true)
        })
      }
    }
  }
})
