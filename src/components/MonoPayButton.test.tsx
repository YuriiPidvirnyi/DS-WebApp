import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// t echoes the key so we can assert the localized branch was taken.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { MonoPayButton } from './MonoPayButton'

const SCRIPT_URL =
  'https://pay.monobank.ua/mono-pay-button/v1/mono-pay-button.js'

describe('MonoPayButton error localization', () => {
  beforeEach(() => {
    // Make the singleton script loader resolve without a real network load.
    if (!document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      const s = document.createElement('script')
      s.src = SCRIPT_URL
      document.head.appendChild(s)
    }
  })

  it('shows a localized init error when the init request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch
    render(<MonoPayButton appointmentId="a1" amountKopecks={1000} />)
    expect(
      await screen.findByText('payments.monoButton.initError')
    ).toBeInTheDocument()
  })

  it('does not surface the server error text verbatim, localizes instead (review #3)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Тестова серверна помилка' }),
    }) as unknown as typeof fetch
    render(<MonoPayButton appointmentId="a1" amountKopecks={1000} />)
    expect(
      await screen.findByText('payments.monoButton.initError')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Тестова серверна помилка')
    ).not.toBeInTheDocument()
  })
})
