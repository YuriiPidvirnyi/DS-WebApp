import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import uk from '@/locales/uk.json'
import en from '@/locales/en.json'
import pl from '@/locales/pl.json'

/**
 * Guards the class of bug where a sidebar nav item's `nameKey` references an
 * i18n key that exists in NO locale, so the nav renders the raw key (e.g.
 * "admin.sidebar.health"). The parity/drift suites only compare locales
 * against each other, so a key missing from all three passes them trivially —
 * this asserts every static `nameKey` literal in the two shell layouts
 * actually resolves in uk/en/pl.
 */
const SHELLS = [
  'app/admin/AdminLayoutClient.tsx',
  'app/cabinet/CabinetLayoutClient.tsx',
]

function collectNameKeys(src: string): string[] {
  // matches:  nameKey: 'a.b.c'   and   nameKey: "a.b.c"
  // Blind spot: only STATIC string literals are collected. If a nav item ever
  // computes its nameKey dynamically (a variable/template/ternary), this guard
  // silently skips it — all nameKeys are literals today, keep them that way.
  return [...src.matchAll(/nameKey:\s*['"]([\w.]+)['"]/g)].map(m => m[1])
}

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

describe('admin/cabinet sidebar nameKeys resolve in every locale', () => {
  const locales = { uk, en, pl } as const

  for (const rel of SHELLS) {
    const src = readFileSync(resolve(process.cwd(), rel), 'utf8')
    const keys = collectNameKeys(src)

    it(`${rel}: found nav nameKeys to check`, () => {
      expect(keys.length).toBeGreaterThan(0)
    })

    for (const key of keys) {
      for (const [lang, dict] of Object.entries(locales)) {
        it(`${rel}: ${key} exists in ${lang}`, () => {
          expect(has(dict, key), `${key} missing from ${lang}.json`).toBe(true)
        })
      }
    }
  }
})
