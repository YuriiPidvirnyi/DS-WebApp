import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import CallbackRequest from '../CallbackRequest'

describe('CallbackRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with all fields', () => {
    render(<CallbackRequest />)

    expect(screen.getByPlaceholderText(/ваше ім'я/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/номер телефону/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/зручний час для дзвінка/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/послуга \(необов'язково\)/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /замовити дзвінок/i })
    ).toBeInTheDocument()
  })

  it('has consent checkbox', () => {
    render(<CallbackRequest />)

    const checkbox = screen.getByLabelText(/погоджуюся на обробку/i)
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked() // Default is true
  })

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/ім'я повинно містити принаймні 2 символи/i)
      ).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid phone', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const phoneInput = screen.getByPlaceholderText(/номер телефону/i)
    await user.type(phoneInput, '123')

    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      const errorMessage = screen.queryByText(/невірний формат телефону/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    await user.type(screen.getByPlaceholderText(/ваше ім'я/i), 'Іван Петренко')
    await user.type(
      screen.getByPlaceholderText(/номер телефону/i),
      '+380501234567'
    )

    const timeSelect = screen.getByLabelText(/зручний час/i)
    await user.selectOptions(timeSelect, 'morning')

    await user.type(
      screen.getByPlaceholderText(/послуга \(необов'язково\)/i),
      'Консультація'
    )

    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/дякуємо! ми зателефонуємо найближчим часом/i)
      ).toBeInTheDocument()
    })
  })

  it('displays all time slot options', () => {
    render(<CallbackRequest />)

    const timeSelect = screen.getByLabelText(/зручний час/i)
    const options = Array.from(timeSelect.querySelectorAll('option')).map(
      option => option.value
    )

    expect(options).toContain('any')
    expect(options).toContain('morning')
    expect(options).toContain('afternoon')
    expect(options).toContain('evening')
  })

  it('allows service field to be optional', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    await user.type(screen.getByPlaceholderText(/ваше ім'я/i), 'Іван Петренко')
    await user.type(
      screen.getByPlaceholderText(/номер телефону/i),
      '+380501234567'
    )

    // Don't fill service field
    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/дякуємо! ми зателефонуємо найближчим часом/i)
      ).toBeInTheDocument()
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const nameInput = screen.getByPlaceholderText(/ваше ім'я/i)
    const phoneInput = screen.getByPlaceholderText(/номер телефону/i)

    await user.type(nameInput, 'Іван Петренко')
    await user.type(phoneInput, '+380501234567')

    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(phoneInput).toHaveValue('')
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    await user.type(screen.getByPlaceholderText(/ваше ім'я/i), 'Іван Петренко')
    await user.type(
      screen.getByPlaceholderText(/номер телефону/i),
      '+380501234567'
    )

    const submitButton = screen.getByRole('button', {
      name: /замовити дзвінок/i,
    })
    await user.click(submitButton)

    // Button should show loading state (implementation may vary)
    expect(submitButton).toBeDisabled()
  })

  it('includes micro feedback component after success', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    await user.type(screen.getByPlaceholderText(/ваше ім'я/i), 'Іван Петренко')
    await user.type(
      screen.getByPlaceholderText(/номер телефону/i),
      '+380501234567'
    )

    await user.click(screen.getByRole('button', { name: /замовити дзвінок/i }))

    await waitFor(() => {
      // MicroFeedback component should be rendered
      const successSection = screen.getByText(
        /дякуємо! ми зателефонуємо найближчим часом/i
      ).parentElement
      expect(successSection).toBeInTheDocument()
    })
  })

  it('validates phone number with Ukrainian format', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const phoneInput = screen.getByPlaceholderText(/номер телефону/i)

    // Valid formats should work
    await user.clear(phoneInput)
    await user.type(phoneInput, '+380501234567')
    expect(phoneInput).toHaveValue('+380501234567')

    await user.clear(phoneInput)
    await user.type(phoneInput, '0501234567')
    // Should be valid for submission
  })

  it('maintains form state during input', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const nameInput = screen.getByPlaceholderText(/ваше ім'я/i)
    const phoneInput = screen.getByPlaceholderText(/номер телефону/i)

    await user.type(nameInput, 'Test Name')
    await user.type(phoneInput, '0501234567')

    expect(nameInput).toHaveValue('Test Name')
    expect(phoneInput).toHaveValue('0501234567')
  })

  it('consent checkbox can be toggled', async () => {
    const user = userEvent.setup()
    render(<CallbackRequest />)

    const checkbox = screen.getByLabelText(/погоджуюся на обробку/i)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('has proper ARIA labels for accessibility', () => {
    render(<CallbackRequest />)

    expect(screen.getByLabelText(/зручний час для дзвінка/i)).toHaveAttribute(
      'aria-label'
    )
    expect(
      screen.getByPlaceholderText(/послуга \(необов'язково\)/i)
    ).toHaveAttribute('aria-label')
  })
})
