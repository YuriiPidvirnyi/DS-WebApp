import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Name" />)
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('shows required indicator', () => {
    render(<Input label="Required Field" required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Input label="Email" error="Email is required" />)
    
    const input = screen.getByLabelText('Email')
    const errorMessage = screen.getByText('Email is required')
    
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveAttribute('role', 'alert')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('displays helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />)
    
    const helperText = screen.getByText('Must be at least 8 characters')
    expect(helperText).toBeInTheDocument()
    
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input label="Name" onChange={handleChange} />)
    
    const input = screen.getByLabelText('Name')
    await user.type(input, 'John Doe')
    
    expect(input).toHaveValue('John Doe')
    expect(handleChange).toHaveBeenCalled()
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input label="Email" type="email" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    
    rerender(<Input label="Phone" type="tel" />)
    expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel')
    
    rerender(<Input label="Password" type="password" />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('applies fullWidth className', () => {
    render(<Input label="Full Width" fullWidth />)
    
    const container = screen.getByLabelText('Full Width').closest('div')
    expect(container).toHaveClass('w-full')
  })

  it('has proper accessibility attributes', () => {
    render(<Input label="Accessible Input" id="test-input" />)
    
    const input = screen.getByLabelText('Accessible Input')
    const label = screen.getByText('Accessible Input')
    
    expect(input).toHaveAttribute('id', 'test-input')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('focuses correctly', async () => {
    const user = userEvent.setup()
    render(<Input label="Focusable" />)
    
    await user.tab()
    expect(screen.getByLabelText('Focusable')).toHaveFocus()
  })

  it('shows error styles when error is present', () => {
    render(<Input label="Input with error" error="This field is required" />)
    
    const input = screen.getByLabelText('Input with error')
    expect(input).toHaveClass('border-red-300', 'focus:border-red-500')
  })

  it('shows normal styles when no error', () => {
    render(<Input label="Normal input" />)
    
    const input = screen.getByLabelText('Normal input')
    expect(input).toHaveClass('border-gray-300', 'focus:border-dental-teal')
  })
})