/**
 * i18n Drift Guard (ROADMAP §B3)
 *
 * Loads uk.json, en.json, and pl.json, recursively collects all dot-path keys,
 * and asserts that EN and PL have the same key set as UK (the reference locale).
 *
 * Pre-existing drift (as of 2026-04-21):
 *   EN and PL are both missing these 5 keys that exist in UK:
 *     - meta.ogImageAlt
 *     - meta.openGraphDescription
 *     - meta.openGraphTitle
 *     - meta.twitterDescription
 *     - meta.twitterTitle
 *
 * Once those keys are added to en.json and pl.json the `test.todo` blocks below
 * should be converted back to strict `expect(missingIn*).toEqual([])` assertions.
 */

import { describe, it, expect } from 'vitest'
import ukRaw from '../locales/uk.json'
import enRaw from '../locales/en.json'
import plRaw from '../locales/pl.json'

type LocaleObj = Record<string, unknown>

/** Recursively collect all dot-path leaf keys from a locale object. */
function collectKeys(obj: LocaleObj, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as LocaleObj, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

const ukKeys = collectKeys(ukRaw as LocaleObj)
const enKeys = collectKeys(enRaw as LocaleObj)
const plKeys = collectKeys(plRaw as LocaleObj)

describe('i18n locale key parity', () => {
  it('uk.json key count is stable', () => {
    // Sanity-check: update this number when new keys are intentionally added to uk.json
    expect(ukKeys.length).toBeGreaterThanOrEqual(1909)
  })

  // ---------------------------------------------------------------------------
  // EN vs UK
  // ---------------------------------------------------------------------------

  it('en.json has no extra keys that are absent from uk.json', () => {
    const extraInEn = enKeys.filter(k => !ukKeys.includes(k))
    expect(extraInEn).toEqual([])
  })

  /**
   * Pre-existing drift: EN is missing 5 meta.* keys.
   * This test documents them and will fail until they are added to en.json.
   * To fix: add the listed keys to src/locales/en.json, then change this to
   *   expect(missingInEn).toEqual([])
   */
  it('en.json has no keys missing vs uk.json', () => {
    const missingInEn = ukKeys.filter(k => !enKeys.includes(k))

    if (missingInEn.length > 0) {
      // Report the drift clearly so CI output is actionable
      expect(
        missingInEn,
        `Keys present in uk.json but MISSING from en.json:\n${missingInEn.map(k => `  - ${k}`).join('\n')}`
      ).toEqual([])
    } else {
      expect(missingInEn).toEqual([])
    }
  })

  // ---------------------------------------------------------------------------
  // PL vs UK
  // ---------------------------------------------------------------------------

  it('pl.json has no extra keys that are absent from uk.json', () => {
    const extraInPl = plKeys.filter(k => !ukKeys.includes(k))
    expect(extraInPl).toEqual([])
  })

  /**
   * Pre-existing drift: PL is missing the same 5 meta.* keys.
   * This test documents them and will fail until they are added to pl.json.
   * To fix: add the listed keys to src/locales/pl.json, then change this to
   *   expect(missingInPl).toEqual([])
   */
  it('pl.json has no keys missing vs uk.json', () => {
    const missingInPl = ukKeys.filter(k => !plKeys.includes(k))

    if (missingInPl.length > 0) {
      expect(
        missingInPl,
        `Keys present in uk.json but MISSING from pl.json:\n${missingInPl.map(k => `  - ${k}`).join('\n')}`
      ).toEqual([])
    } else {
      expect(missingInPl).toEqual([])
    }
  })
})
