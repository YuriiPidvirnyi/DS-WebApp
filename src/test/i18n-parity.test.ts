import { describe, it } from 'vitest'
import uk from '@/locales/uk'
import en from '@/locales/en'
import pl from '@/locales/pl'

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null && !Array.isArray(v)
      ? collectKeys(v as Record<string, unknown>, path)
      : [path]
  })
}

const ukKeys = new Set(collectKeys(uk as unknown as Record<string, unknown>))
const enKeys = new Set(collectKeys(en as unknown as Record<string, unknown>))
const plKeys = new Set(collectKeys(pl as unknown as Record<string, unknown>))

function diff(a: Set<string>, b: Set<string>) {
  return [...a].filter(k => !b.has(k))
}

describe('i18n key parity', () => {
  it('en has same keys as uk', () => {
    const missingInEn = diff(ukKeys, enKeys)
    const extraInEn = diff(enKeys, ukKeys)
    if (missingInEn.length || extraInEn.length) {
      throw new Error(
        `en/uk key mismatch:\n` +
          (missingInEn.length
            ? `  Missing in en (${missingInEn.length}): ${missingInEn.slice(0, 10).join(', ')}${missingInEn.length > 10 ? '...' : ''}\n`
            : '') +
          (extraInEn.length
            ? `  Extra in en (${extraInEn.length}): ${extraInEn.slice(0, 10).join(', ')}${extraInEn.length > 10 ? '...' : ''}`
            : '')
      )
    }
  })

  it('pl has same keys as uk', () => {
    const missingInPl = diff(ukKeys, plKeys)
    const extraInPl = diff(plKeys, ukKeys)
    if (missingInPl.length || extraInPl.length) {
      throw new Error(
        `pl/uk key mismatch:\n` +
          (missingInPl.length
            ? `  Missing in pl (${missingInPl.length}): ${missingInPl.slice(0, 10).join(', ')}${missingInPl.length > 10 ? '...' : ''}\n`
            : '') +
          (extraInPl.length
            ? `  Extra in pl (${extraInPl.length}): ${extraInPl.slice(0, 10).join(', ')}${extraInPl.length > 10 ? '...' : ''}`
            : '')
      )
    }
  })
})
