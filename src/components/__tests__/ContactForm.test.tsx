import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import ContactForm from '../ContactForm'
import * as contactsService from '@/services/contacts'
import * as turnstileVerify from '@/utils/turnstileVerify'

// Mock services
vi.mock('@/services/contacts', () => ({
  createContact: vi.fn(),
}))

vi.mock('@/utils/turnstileVerify', () => ({
  assertValidTurnstile: vi.fn(),
}))

// Mock Turnstile component
vi.mock('@/components/Turnstile', () => ({
  default: ({ onVerify }: { onVerify?: (token: string) => void }) => {
    // Simulate auto-verification
    if (onVerify) {
      setTimeout(() => onVerify('mock-token'), 0)
    }
    return <div data-testid="turnstile-mock">Turnstile Mock</div>
  },
}))

describe('ContactForm', () => {
  const mockCreateContact = vi.mocked(contactsService.createContact)
  const mockAssertValidTurnstile = vi.mocked(
    turnstileVerify.assertValidTurnstile
  )

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAssertValidTurnstile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('renders all form fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/ім'я та прізвище/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/номер телефону/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/повідомлення/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /надіслати/i })
    ).toBeInTheDocument()
  })

  it('shows validation errors for empty form', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/ім'я повинно містити принаймні 2 символи/i)
      ).toBeInTheDocument()
    })
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const phoneInput = screen.getByLabelText(/номер телефону/i)
    await user.type(phoneInput, '123')
    await user.tab()

    await waitFor(() => {
      const errorMessage = screen.queryByText(/невірний формат телефону/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      const errorMessage = screen.queryByText(/невірний формат email/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm />)

    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Хочу записатися на консультацію'
    )

    const consentCheckbox = screen.getByRole('checkbox')
    await user.click(consentCheckbox)

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Іван Петренко',
          phone: '+380501234567',
          email: 'ivan.petrenko@example.com',
          message: 'Хочу записатися на консультацію',
          consent: true,
        })
      )
    })
  })

  it('shows success message after submission', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm />)

    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Хочу записатися на консультацію'
    )

    const consentCheckbox = screen.getByRole('checkbox')
    await user.click(consentCheckbox)

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/повідомлення успішно надіслано/i)
      ).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(screen.getByLabelText(/повідомлення/i), 'Test message')

    const consentCheckbox = screen.getByRole('checkbox')
    await user.click(consentCheckbox)

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true, data: { id: '123' } }), 100)
        )
    )

    render(<ContactForm />)

    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Test message here for validation'
    )
    await user.click(screen.getByRole('checkbox'))

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    const clickPromise = user.click(submitButton)

    // Check that submit button is disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    await clickPromise
  })

  it('formats phone number on blur', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const phoneInput = screen.getByLabelText(/номер телефону/i)
    await user.type(phoneInput, '0501234567')
    await user.tab()

    await waitFor(() => {
      expect(phoneInput).toHaveValue('+380501234567')
    })
  })

  it('shows screen reader announcements for errors', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      const srOnly = document.querySelector('[aria-live="polite"]')
      expect(srOnly).toBeInTheDocument()
    })
  })

  it('requires consent checkbox', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm />)

    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Test message for validation'
    )

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/потрібна згода на обробку/i)).toBeInTheDocument()
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm />)

    const nameInput = screen.getByLabelText(/ім'я та прізвище/i)
    await user.type(nameInput, 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Test message here for validation'
    )
    await user.click(screen.getByRole('checkbox'))

    const submitButton = screen.getByRole('button', { name: /надіслати/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/повідомлення успішно надіслано/i)
      ).toBeInTheDocument()
    })

    // Form should be reset
    expect(nameInput).toHaveValue('')
  })

  it('prevents rapid submissions with cooldown', async () => {
    const user = userEvent.setup()
    mockCreateContact.mockResolvedValue({ success: true, data: { id: '123' } })

    render(<ContactForm />)

    // Submit first time
    await user.type(screen.getByLabelText(/ім'я та прізвище/i), 'Іван Петренко')
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234567')
    await user.type(
      screen.getByLabelText(/email/i),
      'ivan.petrenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Test message here for validation'
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /надіслати/i }))

    await waitFor(() => {
      expect(mockCreateContact).toHaveBeenCalledTimes(1)
    })

    // Try to submit again immediately - fill the form again
    await user.type(
      screen.getByLabelText(/ім'я та прізвище/i),
      'Петро Іваненко'
    )
    await user.type(screen.getByLabelText(/номер телефону/i), '+380501234568')
    await user.type(
      screen.getByLabelText(/email/i),
      'petro.ivanenko@example.com'
    )
    await user.type(
      screen.getByLabelText(/повідомлення/i),
      'Test message 2 here for validation'
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /надіслати/i }))

    // Should not submit again (cooldown active)
    expect(mockCreateContact).toHaveBeenCalledTimes(1)
  })
})
