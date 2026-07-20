import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  SERVICES,
  DOCTORS,
  serviceSvg,
  doctorSvg,
} from '../../scripts/gen-placeholder-images.mjs'

/**
 * Guards the branded placeholder assets against three silent-failure modes the
 * repoint migration (20260720_repoint_placeholder_images.sql) can't catch:
 *
 *  1. A migration literal (or a renamed/deleted file) points at an SVG that
 *     doesn't exist under public/ — the migration would happily write a 404
 *     URL into the DB. → existence check.
 *  2. Someone hand-edits a committed SVG (or changes the generator without
 *     re-running `npm run gen:placeholders`) and the two drift apart. The
 *     generator is the documented source of truth. → exact-output check.
 *  3. A new SVG is added but the migration never learns to reference it (or
 *     vice-versa). → the migration references every generated path.
 */
const PUBLIC = resolve(process.cwd(), 'public')
const migrationSql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260720_repoint_placeholder_images.sql'
  ),
  'utf8'
)

describe('branded placeholder SVGs — services', () => {
  SERVICES.forEach(([slug, kind], i) => {
    const rel = `/services/${slug}.svg`
    const abs = resolve(PUBLIC, `services/${slug}.svg`)

    it(`${rel} exists on disk`, () => {
      expect(existsSync(abs)).toBe(true)
    })

    it(`${rel} matches generator output (no manual drift)`, () => {
      expect(readFileSync(abs, 'utf8')).toBe(serviceSvg(kind, i) + '\n')
    })

    it(`${rel} is referenced by the repoint migration`, () => {
      expect(migrationSql).toContain(rel)
    })
  })
})

describe('branded placeholder SVGs — doctors', () => {
  DOCTORS.forEach(([slug, name], i) => {
    const rel = `/doctors/${slug}.svg`
    const abs = resolve(PUBLIC, `doctors/${slug}.svg`)

    it(`${rel} exists on disk`, () => {
      expect(existsSync(abs)).toBe(true)
    })

    it(`${rel} matches generator output (no manual drift)`, () => {
      expect(readFileSync(abs, 'utf8')).toBe(doctorSvg(name, i) + '\n')
    })

    it(`${rel} is referenced by the repoint migration`, () => {
      expect(migrationSql).toContain(rel)
    })
  })
})
