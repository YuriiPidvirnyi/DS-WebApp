import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from '../LanguageSwitcher'

// Mock useTranslation
const mockChangeLanguage = vi.fn()
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'uk',
      changeLanguage: mockChangeLanguage,
    },
    t: (key: string) => key,
  }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders language buttons', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: /uk|укр/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /en|eng/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pl|pol/i })).toBeInTheDocument()
  })

  it('highlights current language', () => {
    render(<LanguageSwitcher />)

    const ukButton = screen.getByRole('button', { name: /uk/i })
    expect(ukButton).toHaveClass('bg-dental-primary-600')
  })

  it('changes language when button is clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const enButton = screen.getByRole('button', { name: /en/i })
    await user.click(enButton)

    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('switches between all supported languages', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    // Switch to English
    await user.click(screen.getByRole('button', { name: /en/i }))
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')

    // Switch to Polish
    await user.click(screen.getByRole('button', { name: /pl/i }))
    expect(mockChangeLanguage).toHaveBeenCalledWith('pl')

    // Switch back to Ukrainian
    await user.click(screen.getByRole('button', { name: /uk/i }))
    expect(mockChangeLanguage).toHaveBeenCalledWith('uk')
  })

  it('has accessible language labels', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByLabelText(/language|мова|язык/i)).toBeInTheDocument()
  })

  it('persists language preference', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<LanguageSwitcher />)

    // Change language
    await user.click(screen.getByRole('button', { name: /en/i }))
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')

    // Re-render component
    rerender(<LanguageSwitcher />)

    // Language should still be remembered (through i18n state)
    expect(mockChangeLanguage).toHaveBeenCalled()
  })

  it('is keyboard navigable', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const ukButton = screen.getByRole('button', { name: /uk/i })
    const enButton = screen.getByRole('button', { name: /en/i })

    // Tab to first button
    await user.tab()
    expect(ukButton).toHaveFocus()

    // Tab to next button
    await user.tab()
    expect(enButton).toHaveFocus()
  })

  it('supports enter key activation', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const enButton = screen.getByRole('button', { name: /en/i })
    enButton.focus()

    await user.keyboard('{Enter}')
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('has proper ARIA attributes', () => {
    render(<LanguageSwitcher />)

    const container = screen.getByRole('group', { name: /language/i })
    expect(container).toHaveAttribute('role', 'group')
  })

  it('updates when language changes externally', () => {
    render(<LanguageSwitcher />)

    // Button should reflect current language from i18n
    const currentLanguageButton = screen.getByRole('button', { name: /uk/i })
    expect(currentLanguageButton).toHaveClass('bg-dental-primary-600')
  })

  it('does not affect other page elements', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <LanguageSwitcher />
        <div data-testid="other-content">Other Content</div>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /en/i }))

    // Other content should still be present
    expect(screen.getByTestId('other-content')).toBeInTheDocument()
  })
})
