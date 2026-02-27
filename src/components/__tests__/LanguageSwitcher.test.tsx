import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from '../LanguageSwitcher'

// Mock react-i18next
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders language switcher button', () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'true')
  })

  it('displays current language flag and code', () => {
    render(<LanguageSwitcher />)

    // Default language is Ukrainian
    expect(screen.getByText(/UK/i)).toBeInTheDocument()
  })

  it('opens dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('displays all available languages in dropdown', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    expect(screen.getByText('Українська')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Polski')).toBeInTheDocument()
  })

  it('changes language when option is selected', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    const englishOption = screen.getByText('English')
    await user.click(englishOption)

    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('closes dropdown after language selection', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)
    
    const englishOption = screen.getByText('English')
    await user.click(englishOption)

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <LanguageSwitcher />
        <button data-testid="outside">Outside</button>
      </div>
    )

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    expect(screen.getByRole('menu')).toBeInTheDocument()

    const outsideButton = screen.getByTestId('outside')
    await user.click(outsideButton)

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('shows check mark for current language', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    // Ukrainian should be active and have the check mark indicator
    const ukrainianOption = screen.getByText('Українська').closest('button')
    expect(ukrainianOption).toHaveClass('text-dental-teal', 'font-semibold')
  })

  it('has proper accessibility attributes for menu items', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    const menu = screen.getByRole('menu')
    expect(menu).toHaveAttribute('aria-orientation', 'vertical')

    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems).toHaveLength(3)
  })

  it('toggles dropdown on repeated clicks', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    
    // First click opens
    await user.click(button)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Second click closes
    await user.click(button)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    // Third click opens again
    await user.click(button)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('maintains focus management', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    // Menu items should be clickable
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems.length).toBe(3)
    
    // Each menu item should be interactive
    for (const item of menuItems) {
      expect(item).not.toBeDisabled()
    }
  })
})
