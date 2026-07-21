import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// t echoes the key (labels assert on i18n keys); i18n.language drives dates
// and service-name localization. Mutable so a test can flip the active
// language; defaults to 'uk' so every existing assertion is unaffected.
const i18nState = vi.hoisted(() => ({ language: 'uk' }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: i18nState }),
}))

// WalletCards has its own hooks/fetches — stub it; this suite covers the
// payments list/branching only.
vi.mock('@/components/cabinet/WalletCards', () => ({
  WalletCards: () => <div data-testid="wallet-cards" />,
}))

import CabinetPaymentsPage, { type Payment } from './CabinetPaymentsPage'

const paidPayment: Payment = {
  id: 'pay1',
  invoice_id: 'inv1',
  amount_kopecks: 180000,
  payment_mode: 'full',
  status: 'success',
  created_at: '2026-07-01T10:00:00Z',
  paid_at: '2026-07-01T10:05:00Z',
  appointments: [
    {
      appointment_date: '2026-07-01',
      appointment_time: '10:00:00',
      services: [{ name_uk: 'Професійна гігієна' }],
    },
  ],
}

describe('CabinetPaymentsPage', () => {
  it('renders the empty state when there are no payments', () => {
    render(<CabinetPaymentsPage payments={[]} cards={[]} />)
    expect(screen.getByText('cabinet.payments.empty.title')).toBeInTheDocument()
    // Empty-state CTA links to booking.
    expect(
      screen.getByText('cabinet.payments.empty.action')
    ).toBeInTheDocument()
    // No table headers when empty.
    expect(
      screen.queryByText('cabinet.payments.columns.status')
    ).not.toBeInTheDocument()
  })

  it('renders the table + mobile list with service, amount and labels', () => {
    render(<CabinetPaymentsPage payments={[paidPayment]} cards={[]} />)
    // Column header appears once (desktop table only).
    expect(
      screen.getByText('cabinet.payments.columns.status')
    ).toBeInTheDocument()
    // Data rows are duplicated across desktop table + mobile list.
    expect(screen.getAllByText('Професійна гігієна').length).toBeGreaterThan(0)
    // Amount = kopecks/100, with the currency key from i18n.
    expect(screen.getAllByText(/180000\.00|1800\.00/).length).toBeGreaterThan(0)
    // Status/mode resolve through i18n keys.
    expect(
      screen.getAllByText('cabinet.payments.statuses.success').length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('cabinet.payments.modes.full').length
    ).toBeGreaterThan(0)
  })

  it('falls back gracefully for an unrecognized status (neutral tone, no crash)', () => {
    const weird = {
      ...paidPayment,
      id: 'pay2',
      status: 'totally_unknown' as Payment['status'],
    }
    // Should render without throwing on the `STATUS_TONES[...] ?? 'neutral'`
    // default and the status label defaultValue fallback.
    expect(() =>
      render(<CabinetPaymentsPage payments={[weird]} cards={[]} />)
    ).not.toThrow()
    expect(
      screen.getAllByText('cabinet.payments.statuses.totally_unknown').length
    ).toBeGreaterThan(0)
  })

  it('renders a dash when the payment has no linked service', () => {
    const noService: Payment = {
      ...paidPayment,
      id: 'pay3',
      appointments: null,
    }
    render(<CabinetPaymentsPage payments={[noService]} cards={[]} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  // Guards the view→helper wiring for #8: a revert to `svc.name_uk` (or an
  // exact `=== 'en'` check) would still pass the localizedServiceName unit
  // tests, so assert the rendered name actually follows i18n.language here.
  it('renders the localized service name for the active language', () => {
    const localized: Payment = {
      ...paidPayment,
      id: 'payLoc',
      appointments: [
        {
          appointment_date: '2026-07-01',
          appointment_time: '10:00:00',
          services: [
            {
              name_uk: 'Професійна гігієна',
              name_en: 'Professional hygiene',
              name_pl: 'Higiena profesjonalna',
            },
          ],
        },
      ],
    }
    i18nState.language = 'en'
    try {
      render(<CabinetPaymentsPage payments={[localized]} cards={[]} />)
      expect(
        screen.getAllByText('Professional hygiene').length
      ).toBeGreaterThan(0)
      expect(screen.queryByText('Професійна гігієна')).not.toBeInTheDocument()
    } finally {
      i18nState.language = 'uk'
    }
  })
})
