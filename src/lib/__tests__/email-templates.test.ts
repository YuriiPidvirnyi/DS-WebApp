import { describe, it, expect } from 'vitest'
import {
  bookingConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newBookingAdminEmail,
  recallEmail,
  reviewRequestEmail,
} from '@/lib/email-templates'

const bookingData = {
  patientName: 'Тарас',
  service: 'Професійна гігієна',
  date: '2026-07-20',
  time: '10:30:00',
  appointmentId: 'appt-1',
  doctorName: 'Ковальчук Микола',
}

describe('booking lifecycle emails', () => {
  it('booking confirmation renders subject, patient and service', () => {
    const email = bookingConfirmationEmail(bookingData, 'uk')

    expect(email.subject).toContain('10:30')
    expect(email.html).toContain('Тарас')
    expect(email.html).toContain('Професійна гігієна')
    expect(email.text).toContain('Професійна гігієна')
  })

  it('reminder and cancellation render in all locales', () => {
    for (const locale of ['uk', 'en', 'pl'] as const) {
      const reminder = appointmentReminderEmail(bookingData, locale)
      const cancellation = appointmentCancellationEmail(
        { ...bookingData, reason: 'test' },
        locale
      )
      expect(reminder.subject).toBeTruthy()
      expect(reminder.html).toContain('Тарас')
      expect(cancellation.subject).toBeTruthy()
      expect(cancellation.html).toContain('Тарас')
    }
  })

  it('admin alert includes contact details', () => {
    const email = newBookingAdminEmail({
      patientName: 'Тарас',
      phone: '+380671234567',
      email: 'taras@example.com',
      service: 'Гігієна',
      date: '2026-07-20',
      time: '10:30:00',
      appointmentId: 'appt-1',
    })

    expect(email.html).toContain('+380671234567')
    expect(email.html).toContain('taras@example.com')
  })
})

describe('recallEmail', () => {
  it('renders all three touches with booking CTA and opt-out', () => {
    for (const touch of [1, 2, 3] as const) {
      const email = recallEmail({ patientName: 'Тарас', touch }, 'uk')
      expect(email.subject).toBeTruthy()
      expect(email.html).toContain('/booking')
      expect(email.html).toContain('/cabinet/profile#notifications')
      expect(email.text).toContain('Тарас')
    }
  })
})

describe('reviewRequestEmail', () => {
  it.each(['uk', 'en', 'pl'] as const)(
    'renders the %s locale with tracked review link and opt-out',
    locale => {
      const email = reviewRequestEmail({ patientName: 'Тарас' }, locale)

      expect(email.subject).toBeTruthy()
      expect(email.html).toContain('/r/google?src=email')
      expect(email.html).toContain('/cabinet/profile#notifications')
      expect(email.html).toContain('Тарас')
      expect(email.text).toContain('/r/google?src=email')
    }
  )

  it('never conditions the ask on an incentive (no gift wording)', () => {
    // Compliance guard: the review ask must stay incentive-free.
    const email = reviewRequestEmail({ patientName: 'Тарас' }, 'uk')
    expect(email.html.toLowerCase()).not.toContain('подарунок')
    expect(email.html.toLowerCase()).not.toContain('curaprox')
  })
})
