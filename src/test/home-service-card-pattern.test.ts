import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Source-level guard for the Home services-grid redesign. The old pattern —
 * a dark overlay div with a white title painted over the card image — both
 * fought the WCAG rule for Brand Blue (white on #AECED3 is banned) and forced
 * ugly center-crops of mismatched photos. The title must live in the card
 * body as dental-dark text, and no overlay layer may return.
 */
const src = readFileSync(resolve(process.cwd(), 'src/views/Home.tsx'), 'utf8')

describe('Home services grid — card pattern', () => {
  it('has no dark overlay layer over the card image', () => {
    expect(src).not.toContain('bg-dental-dark/40')
  })

  it('does not paint a white title over the image', () => {
    expect(src).not.toMatch(/text-white[^\n]*\n?[^\n]*\{service\.title\}/)
  })

  it('renders the title in the card body as dental-dark text', () => {
    expect(src).toMatch(/text-dental-dark[^\n]*"?>\s*\n?\s*\{service\.title\}/)
  })
})
