import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Footer from '../Footer'

describe('Footer', () => {
  it('renders footer with contentinfo role', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('displays clinic name and description', () => {
    render(<Footer />)
    // Logo component includes Dental Story text multiple times
    const dentalStoryElements = screen.getAllByText(/Dental Story/i)
    expect(dentalStoryElements.length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Сучасна стоматологічна клініка/i)
    ).toBeInTheDocument()
  })

  it('displays contact information', () => {
    render(<Footer />)

    // Phone number - find by href starting with tel:
    const links = screen.getAllByRole('link')
    const phoneLink = links.find(link =>
      link.getAttribute('href')?.startsWith('tel:')
    )
    expect(phoneLink).toBeDefined()
    expect(phoneLink?.getAttribute('href')).toMatch(/^tel:\+380\d{9}/)

    // Email - find by href starting with mailto:
    const emailLink = links.find(link =>
      link.getAttribute('href')?.startsWith('mailto:')
    )
    expect(emailLink).toBeDefined()
    expect(emailLink?.getAttribute('href')).toContain('@')

    // Address - flexible matching
    expect(screen.getByText(/Сумська|Львів|вулиця/i)).toBeInTheDocument()
  })

  it('displays working hours', () => {
    render(<Footer />)
    // Check for working hours content
    const workingHours = screen.getAllByText(/09:00|Пн-Пт/i)
    expect(workingHours.length).toBeGreaterThan(0)
  })

  it('has navigation links', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /Послуги/i })).toHaveAttribute(
      'href',
      '/services'
    )
    expect(screen.getByRole('link', { name: /Про нас/i })).toHaveAttribute(
      'href',
      '/about'
    )
    expect(screen.getByRole('link', { name: /Контакти/i })).toHaveAttribute(
      'href',
      '/contact'
    )
  })

  it('has social media links', () => {
    render(<Footer />)

    const facebookLink = screen.getByLabelText(/Facebook/i)
    expect(facebookLink).toBeInTheDocument()

    const instagramLink = screen.getByLabelText(/Instagram/i)
    expect(instagramLink).toBeInTheDocument()
  })

  it('displays copyright notice', () => {
    render(<Footer />)
    // Check for copyright text with year
    expect(screen.getByText(/©.*Dental Story/i)).toBeInTheDocument()
  })

  it('has legal links', () => {
    render(<Footer />)

    expect(
      screen.getByRole('link', { name: /Політика конфіденційності/i })
    ).toHaveAttribute('href', '/privacy-policy')
    expect(
      screen.getByRole('link', { name: /Умови використання/i })
    ).toHaveAttribute('href', '/terms-of-service')
  })

  it('social media links are present', () => {
    render(<Footer />)

    // Check that social media links exist
    expect(screen.getByLabelText(/Facebook/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Instagram/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Telegram/i)).toBeInTheDocument()
  })

  it('has proper ARIA labels for icons', () => {
    render(<Footer />)

    // Social media icons should have accessible labels
    expect(screen.getByLabelText(/Facebook/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Instagram/i)).toBeInTheDocument()
  })
})
