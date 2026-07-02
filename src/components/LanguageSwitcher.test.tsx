import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uk' },
  }),
}))

vi.mock('@/locales/uk', () => ({
  default: {
    languageSwitcher: {
      aria: {
        select: 'Select language',
        available: 'Available languages',
        switchTo: 'Switch to {{language}}',
      },
      languages: {
        uk: { name: 'Ukrainian', nativeName: 'Українська' },
        en: { name: 'English', nativeName: 'English' },
        pl: { name: 'Polish', nativeName: 'Polski' },
      },
    },
  },
}))

vi.mock('@/i18n/runtime', () => ({
  switchLanguage: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('lucide-react', () => ({
  Globe: () => <span data-testid="globe-icon" />,
  ChevronDown: () => <span data-testid="chevron-icon" />,
  Check: () => <span data-testid="check-icon" />,
}))

import LanguageSwitcher from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders dropdown trigger button', () => {
    render(<LanguageSwitcher />)
    const trigger = screen.getByRole('button', { expanded: false })
    expect(trigger).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<LanguageSwitcher />)
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('renders inline variant with all language buttons', () => {
    render(<LanguageSwitcher variant="inline" />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('closes dropdown on Escape key', () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
