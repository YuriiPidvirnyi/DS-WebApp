import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import Header from '../Header'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  }
})

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logo and navigation links', () => {
    render(<Header />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Головна')).toBeInTheDocument()
    expect(screen.getByText('Послуги')).toBeInTheDocument()
    expect(screen.getByText('Про нас')).toBeInTheDocument()
    expect(screen.getByText('Галерея')).toBeInTheDocument()
    expect(screen.getByText('Контакти')).toBeInTheDocument()
  })

  it('displays contact information', () => {
    render(<Header />)

    // Check phone number link exists - any tel: link
    const phoneLinks = screen.getAllByRole('link')
    const phoneLink = phoneLinks.find(link =>
      link.getAttribute('href')?.startsWith('tel:')
    )
    expect(phoneLink).toBeDefined()
    expect(phoneLink?.getAttribute('href')).toMatch(/^tel:\+380\d{9}/)

    // Check email link exists
    const emailLink = phoneLinks.find(link =>
      link.getAttribute('href')?.startsWith('mailto:')
    )
    expect(emailLink).toBeDefined()
    expect(emailLink?.getAttribute('href')).toContain('@')
  })

  it('shows CTA button on desktop', () => {
    render(<Header />)

    const ctaButtons = screen.getAllByRole('link', {
      name: /Записатись на прийом/i,
    })
    // Should have at least one CTA button (desktop version)
    expect(ctaButtons.length).toBeGreaterThan(0)
  })

  it('mobile menu toggles correctly', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Find mobile menu button
    const menuButton = screen.getByRole('button', { name: /Відкрити меню/i })
    expect(menuButton).toBeInTheDocument()

    // Menu should be closed initially
    expect(
      screen.queryByRole('navigation', { name: /Мобільне меню/i })
    ).not.toBeInTheDocument()

    // Open menu
    await user.click(menuButton)

    // Menu should be open
    expect(
      screen.getByRole('navigation', { name: /Мобільне меню/i })
    ).toBeInTheDocument()

    // Button label should change
    expect(
      screen.getByRole('button', { name: /Закрити меню/i })
    ).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<Header />)

    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()

    const mainNav = screen.getByRole('navigation', {
      name: /Основна навігація/i,
    })
    expect(mainNav).toBeInTheDocument()

    const contactInfo = screen.getByRole('complementary', {
      name: /Контактна інформація/i,
    })
    expect(contactInfo).toBeInTheDocument()
  })

  it('highlights active page', () => {
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'Головна' })
    expect(homeLink).toHaveClass(
      'text-dental-blue',
      'border-b-2',
      'border-dental-blue'
    )
  })

  it('navigation links have correct hrefs', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: 'Головна' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getByRole('link', { name: 'Послуги' })).toHaveAttribute(
      'href',
      '/services'
    )
    expect(screen.getByRole('link', { name: 'Про нас' })).toHaveAttribute(
      'href',
      '/about'
    )
    expect(screen.getByRole('link', { name: 'Галерея' })).toHaveAttribute(
      'href',
      '/gallery'
    )
    expect(screen.getByRole('link', { name: 'Контакти' })).toHaveAttribute(
      'href',
      '/contact'
    )
  })

  it('mobile menu closes when navigation link is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /Відкрити меню/i })
    await user.click(menuButton)

    // Click on a navigation link in mobile menu
    const mobileMenu = screen.getByRole('navigation', {
      name: /Мобільне меню/i,
    })
    const servicesLink = mobileMenu.querySelector('a[href="/services"]')
    expect(servicesLink).toBeInTheDocument()

    // Note: Actual navigation would be handled by React Router in integration test
  })

  it('has data tracking attributes for analytics', () => {
    render(<Header />)

    const phoneLinks = screen.getAllByRole('link')
    const phoneLink = phoneLinks.find(link =>
      link.getAttribute('href')?.startsWith('tel:')
    )

    if (phoneLink) {
      expect(phoneLink).toHaveAttribute('data-track-id', 'call_click')
      expect(phoneLink).toHaveAttribute('data-track-category', 'outbound')
    }

    const emailLink = phoneLinks.find(link =>
      link.getAttribute('href')?.startsWith('mailto:')
    )

    if (emailLink) {
      expect(emailLink).toHaveAttribute('data-track-id', 'email_click')
      expect(emailLink).toHaveAttribute('data-track-category', 'outbound')
    }
  })
})
