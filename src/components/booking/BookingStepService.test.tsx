import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import BookingStepService from './BookingStepService'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const SLOTS = ['09:00', '09:30', '10:00']

function Harness({ slots = SLOTS }: { slots?: string[] }) {
  const form = useForm({
    defaultValues: {
      service: '',
      date: '',
      time: '',
      doctor: 'any',
      isFirstVisit: false,
    },
  })
  return (
    <BookingStepService
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form={form as any}
      slots={slots}
      loadingSlots={false}
      slotsLoadError={null}
    />
  )
}

describe('BookingStepService time radiogroup (a11y)', () => {
  it('renders the slots as a radiogroup of radios', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(SLOTS.length)
  })

  it('roving tabindex: only the first slot is tabbable when none is selected', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('tabindex', '0')
    expect(radios[1]).toHaveAttribute('tabindex', '-1')
    expect(radios[2]).toHaveAttribute('tabindex', '-1')
  })

  it('selects a slot on click and makes it the tab stop', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[1]).toHaveAttribute('tabindex', '0')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[0]).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowRight moves selection AND focus to the next slot', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    radios[0].focus()
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' })
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(document.activeElement).toBe(radios[1])
  })

  it('ArrowRight on the last slot wraps to the first', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[2])
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' })
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(document.activeElement).toBe(radios[0])
  })

  it('ArrowLeft on the first slot wraps to the last', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    radios[0].focus()
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' })
    expect(radios[2]).toHaveAttribute('aria-checked', 'true')
    expect(document.activeElement).toBe(radios[2])
  })

  it('Home and End jump to the ends', () => {
    render(<Harness />)
    const radios = screen.getAllByRole('radio')
    fireEvent.keyDown(radios[0], { key: 'End' })
    expect(radios[2]).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radios[2], { key: 'Home' })
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
  })
})
