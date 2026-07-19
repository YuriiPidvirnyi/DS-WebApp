import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock react-i18next so t() returns the key (keeps assertions stable).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ConfirmDialog } from './ConfirmDialog'

const baseProps = {
  open: true,
  title: 'Видалити картку пацієнта?',
  confirmLabel: 'Видалити',
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(<ConfirmDialog {...baseProps} open={false} />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('moves initial focus into the dialog on open (not stranded on trigger)', () => {
    // Regression test: useFocusTrap only traps Tab; the dialog must set its own
    // initial focus so it does not stay behind the modal.
    render(<ConfirmDialog {...baseProps} />)
    const dialog = screen.getByRole('alertdialog')
    expect(document.activeElement).toBe(dialog)
  })

  it('focuses the confirmation input for irreversible dialogs that require typing', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        severity="irreversible"
        confirmationWord="Шевченко"
      />
    )
    const input = screen.getByRole('textbox')
    expect(document.activeElement).toBe(input)
  })

  it('renders the consequences list when provided', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        consequences={['Історія лікування', 'Записи на прийом']}
      />
    )
    expect(
      screen.getByText('confirmDialog.consequencesTitle')
    ).toBeInTheDocument()
    expect(screen.getByText('Історія лікування')).toBeInTheDocument()
  })

  it('keeps the confirm button disabled until the control word matches', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        severity="irreversible"
        confirmationWord="Шевченко"
      />
    )
    const confirmBtn = screen.getByRole('button', { name: 'Видалити' })
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Шевченко' },
    })
    expect(confirmBtn).toBeEnabled()
  })
})
