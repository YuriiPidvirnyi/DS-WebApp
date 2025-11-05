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

    // Phone number - find by href
    const links = screen.getAllByRole('link')
    const phoneLink = links.find(
      link => link.getAttribute('href') === 'tel:+380504554774'
    )
    expect(phoneLink).toBeInTheDocument()

    // Email
    const emailLink = links.find(
      link => link.getAttribute('href') === 'mailto:info@dentalstory.com.ua'
    )
    expect(emailLink).toBeInTheDocument()

    // Address
    expect(screen.getByText(/Академіка Корольова/i)).toBeInTheDocument()
  })

  it('displays working hours', () => {
    render(<Footer />)
    // Check for working hours content (multiple elements contain 9:00)
    const workingHours = screen.getAllByText(/9:00/i)
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
    // Note: Currently placeholder links with '#', would need real URLs

    const instagramLink = screen.getByLabelText(/Instagram/i)
    expect(instagramLink).toBeInTheDocument()
  })

  it('displays copyright notice', () => {
    render(<Footer />)
    // Check for copyright text with year (2024 is hardcoded in component)
    expect(screen.getByText(/© 2024.*Dental Story/i)).toBeInTheDocument()
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
