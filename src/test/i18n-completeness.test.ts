/**
 * i18n key-completeness guard (B3)
 *
 * Ukrainian (uk) is the source of truth.
 * English (en) and Polish (pl) must have an identical key set.
 * This test fails CI whenever a key is added to uk but not backfilled
 * into the other two locales, or whenever an extra key sneaks into en/pl.
 */
import { describe, it, expect } from 'vitest'
import uk from '@/locales/uk'
import en from '@/locales/en'
import pl from '@/locales/pl'

/** Recursively collect every leaf key path, e.g. "booking.form.title" */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return flattenKeys(v, path)
    }
    return [path]
  })
}

const ukKeys = new Set(flattenKeys(uk))
const enKeys = new Set(flattenKeys(en))
const plKeys = new Set(flattenKeys(pl))

function missing(source: Set<string>, target: Set<string>): string[] {
  return [...source].filter(k => !target.has(k)).sort()
}

function extra(source: Set<string>, target: Set<string>): string[] {
  return [...target].filter(k => !source.has(k)).sort()
}

describe('i18n locale completeness (uk is source of truth)', () => {
  it('en — no keys missing from uk', () => {
    const keys = missing(ukKeys, enKeys)
    expect(
      keys,
      `en is missing ${keys.length} key(s) from uk:\n${keys.join('\n')}`
    ).toHaveLength(0)
  })

  it('pl — no keys missing from uk', () => {
    const keys = missing(ukKeys, plKeys)
    expect(
      keys,
      `pl is missing ${keys.length} key(s) from uk:\n${keys.join('\n')}`
    ).toHaveLength(0)
  })

  it('en — no extra keys not in uk', () => {
    const keys = extra(ukKeys, enKeys)
    expect(
      keys,
      `en has ${keys.length} extra key(s) not present in uk:\n${keys.join('\n')}`
    ).toHaveLength(0)
  })

  it('pl — no extra keys not in uk', () => {
    const keys = extra(ukKeys, plKeys)
    expect(
      keys,
      `pl has ${keys.length} extra key(s) not present in uk:\n${keys.join('\n')}`
    ).toHaveLength(0)
  })
})
