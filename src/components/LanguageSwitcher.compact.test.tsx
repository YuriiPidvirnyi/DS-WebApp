import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'

const setLanguageMock = vi.fn()
vi.mock('@/i18n/config', () => ({
  setLanguage: (code: string) => setLanguageMock(code),
}))

import LanguageSwitcher from './LanguageSwitcher'

/**
 * Regression guard for the compact topbar variant (showNativeName=false) —
 * a distinct render branch that once shipped the 'uk' ISO code as a literal
 * "UK" (read: United Kingdom) and flag emoji the design canon bans.
 */
describe('LanguageSwitcher — compact topbar variant', () => {
  it('trigger shows the UA label, never the "UK" ISO code or a flag', () => {
    render(<LanguageSwitcher variant="dropdown" showNativeName={false} />)
    const trigger = screen.getByRole('button')
    expect(trigger.textContent).toContain('UA')
    expect(trigger.textContent).not.toContain('UK')
    expect(trigger.textContent).not.toMatch(/🇺🇦|🇬🇧|🇵🇱/u)
  })

  it('opens a flag-free menu and switches language', () => {
    render(<LanguageSwitcher variant="dropdown" showNativeName={false} />)
    fireEvent.click(screen.getByRole('button'))

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    for (const o of options) {
      expect(o.textContent).not.toMatch(/🇺🇦|🇬🇧|🇵🇱/u)
    }

    // Options are ordered uk, en, pl (test i18n has empty resources, so
    // labels render raw keys — select by role position, not text).
    fireEvent.click(options[1])
    expect(setLanguageMock).toHaveBeenCalledWith('en')
  })
})
