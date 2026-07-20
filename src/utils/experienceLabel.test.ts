import { describe, it, expect } from 'vitest'
import { experienceLabel } from './experienceLabel'

// Mimic i18next: echo the key + interpolated years so we can assert which
// plural bucket was selected.
const t = (key: string, opts?: Record<string, unknown>) =>
  `${key}:${opts?.years}`

describe('experienceLabel', () => {
  it('English: 1 → one, everything else → many (incl. 21/31, the bug)', () => {
    expect(experienceLabel(t, 'en', 1)).toBe('about.experience.one:1')
    expect(experienceLabel(t, 'en', 5)).toBe('about.experience.many:5')
    // The whole point of the fix: 21 must be "years", not "year".
    expect(experienceLabel(t, 'en', 21)).toBe('about.experience.many:21')
    expect(experienceLabel(t, 'en-US', 31)).toBe('about.experience.many:31')
  })

  it('Ukrainian: Slavic mod10/mod100 buckets', () => {
    expect(experienceLabel(t, 'uk', 1)).toBe('about.experience.one:1')
    expect(experienceLabel(t, 'uk', 2)).toBe('about.experience.few:2')
    expect(experienceLabel(t, 'uk', 5)).toBe('about.experience.many:5')
    expect(experienceLabel(t, 'uk', 11)).toBe('about.experience.many:11')
    expect(experienceLabel(t, 'uk', 21)).toBe('about.experience.one:21')
    expect(experienceLabel(t, 'uk', 22)).toBe('about.experience.few:22')
  })
})
