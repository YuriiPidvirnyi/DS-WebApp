import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  SERVICES,
  CATEGORIES,
  DOCTORS,
  serviceSvg,
  categorySvg,
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

/**
 * Browsers refuse to render an SVG that isn't well-formed XML — a duplicate
 * attribute once shipped every crown card as a broken "image unavailable"
 * slot. Parse every committed placeholder with DOMParser and fail loudly.
 */
describe('branded placeholder SVGs — well-formed XML', () => {
  const all = [
    ...SERVICES.map(([slug]) => `services/${slug}.svg`),
    ...CATEGORIES.map(([slug]) => `services/${slug}.svg`),
    ...DOCTORS.map(([slug]) => `doctors/${slug}.svg`),
  ]
  for (const rel of all) {
    it(`${rel} parses as XML`, () => {
      const doc = new DOMParser().parseFromString(
        readFileSync(resolve(PUBLIC, rel), 'utf8'),
        'image/svg+xml'
      )
      expect(doc.querySelector('parsererror')?.textContent ?? null).toBeNull()
    })
  }
})

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

describe('branded placeholder SVGs — home category tiles', () => {
  // Consumed by images.json services[] (the Home «Повний спектр послуг» grid),
  // not by any DB migration — so only existence + drift are pinned here.
  const imagesJson = readFileSync(
    resolve(process.cwd(), 'src/content/images.json'),
    'utf8'
  )

  CATEGORIES.forEach(([slug, kind], i) => {
    const rel = `/services/${slug}.svg`
    const abs = resolve(PUBLIC, `services/${slug}.svg`)

    it(`${rel} exists on disk`, () => {
      expect(existsSync(abs)).toBe(true)
    })

    it(`${rel} matches generator output (no manual drift)`, () => {
      expect(readFileSync(abs, 'utf8')).toBe(categorySvg(kind, i) + '\n')
    })

    it(`${rel} is referenced by images.json`, () => {
      expect(imagesJson).toContain(rel)
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

/**
 * The repoint migrations match rows by literal name_en / last_name, coupled
 * by-value (not FK-enforced) to scripts/003_seed_data.sql. If a seed row is
 * renamed without updating a migration, that migration silently stops
 * repointing the row ("fails open", per its own comment). This turns that
 * silent drift into a loud CI failure — for BOTH repoint migrations (SVG
 * placeholders and the real-photo upgrade).
 */
const REPOINT_MIGRATIONS: Array<{ file: string; expectedKeys: number }> = [
  { file: '20260720_repoint_placeholder_images.sql', expectedKeys: 19 },
  { file: '20260721_services_real_photos.sql', expectedKeys: 5 },
]

describe('repoint migrations ↔ seed coupling', () => {
  const seedSql = readFileSync(
    resolve(process.cwd(), 'scripts/003_seed_data.sql'),
    'utf8'
  )

  for (const { file, expectedKeys } of REPOINT_MIGRATIONS) {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations', file),
      'utf8'
    )
    // Each match key is the literal preceding an asset path in the migration's
    // VALUES lists: a service name_en or a doctor last_name. Asset paths are
    // either /services|doctors/*.svg placeholders or /assets/images/** photos.
    const rows = [
      ...sql.matchAll(
        /\(\s*'([^']+)'\s*,\s*'(\/(?:services|doctors|assets)\/[^']+)'\s*\)/g
      ),
    ].map(m => ({ key: m[1], asset: m[2] }))

    it(`${file}: extracts every coupling key`, () => {
      expect(rows).toHaveLength(expectedKeys)
    })

    for (const { key, asset } of rows) {
      it(`${file}: seed still defines the match key "${key}"`, () => {
        // Quoted so a partial rename (e.g. "Metal Braces" -> "Metal Braces
        // (upper)") still trips the guard rather than passing on a substring.
        expect(seedSql).toContain(`'${key}'`)
      })

      it(`${file}: referenced asset ${asset} exists under public/`, () => {
        expect(existsSync(resolve(PUBLIC, `.${asset}`))).toBe(true)
      })
    }
  }
})
