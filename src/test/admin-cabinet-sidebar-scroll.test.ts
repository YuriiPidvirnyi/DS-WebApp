import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Regression guard for the fixed-sidebar scroll bug.
 *
 * The admin and cabinet shells render a full-height fixed <aside> whose middle
 * <nav> must scroll while the footer (logout / book) stays pinned. That only
 * works if the intermediate `flex flex-col flex-1` column carries `min-h-0`:
 * without it the column's default `min-height:auto` grows to full content
 * height and overflows the viewport, so the bottom nav items and the footer
 * (logout) end up unreachable off-screen — verified empirically with Playwright
 * (nav clientHeight == scrollHeight, logout below the fold) before the fix.
 *
 * These are source-level assertions (jsdom can't compute flex layout), so they
 * fail loudly if a future refactor drops the guard or reintroduces the
 * unconstrained wrapper.
 */
const shells = [
  'app/admin/AdminLayoutClient.tsx',
  'app/cabinet/CabinetLayoutClient.tsx',
]

describe('fixed sidebar keeps a bounded, scrollable nav (min-h-0 guard)', () => {
  for (const rel of shells) {
    const src = readFileSync(resolve(process.cwd(), rel), 'utf8')

    it(`${rel}: desktop column is min-h-0 (bounded to the fixed aside)`, () => {
      expect(src).toContain('flex flex-col flex-1 min-h-0')
      // The unguarded wrapper (no min-h-0) must never come back.
      expect(src).not.toContain('flex flex-col flex-1 bg-white')
    })

    it(`${rel}: the scrollable nav pairs overflow-y-auto with min-h-0`, () => {
      expect(src).toContain(
        'flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto'
      )
    })
  }
})
