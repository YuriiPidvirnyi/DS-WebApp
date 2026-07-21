import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CASES, caseSvg } from '../../scripts/gen-before-after-cases.mjs'
import { beforeAfterCases } from '@/components/BeforeAfterGallery'

/**
 * Пінить ілюстрації «до/після» до їхнього генератора — та сама схема, що
 * placeholder-images.test.ts для тайлів послуг:
 *  1. кожен шлях із beforeAfterCases існує під public/ (битий src = порожній
 *     слайд без жодної помилки збірки);
 *  2. файл побайтово збігається з виводом генератора (ручний дрифт = фейл);
 *  3. SVG — валідний XML (дубльований атрибут колись ламав крони «тихо»);
 *  4. генератор і компонент погоджені за списком кейсів.
 */
const PUBLIC = resolve(process.cwd(), 'public')

describe('before/after case illustrations', () => {
  it('generator and component agree on the case list', () => {
    expect(CASES.map(([id]) => id)).toEqual(beforeAfterCases.map(c => c.id))
  })

  for (const [id, kind] of CASES) {
    for (const phase of ['before', 'after'] as const) {
      const rel = `assets/images/before-after/case-${id}-${phase}.svg`
      const abs = resolve(PUBLIC, rel)

      it(`${rel} exists on disk`, () => {
        expect(existsSync(abs)).toBe(true)
      })

      it(`${rel} matches generator output (no manual drift)`, () => {
        expect(readFileSync(abs, 'utf8')).toBe(caseSvg(kind, phase) + '\n')
      })

      it(`${rel} parses as XML`, () => {
        const doc = new DOMParser().parseFromString(
          readFileSync(abs, 'utf8'),
          'image/svg+xml'
        )
        expect(doc.querySelector('parsererror')?.textContent ?? null).toBeNull()
      })
    }
  }

  for (const c of beforeAfterCases) {
    it(`case ${c.id} slider paths point at committed illustrations`, () => {
      expect(existsSync(resolve(PUBLIC, `.${c.beforeImage}`))).toBe(true)
      expect(existsSync(resolve(PUBLIC, `.${c.afterImage}`))).toBe(true)
    })
  }
})
