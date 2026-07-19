import { describe, it, expect, beforeAll } from 'vitest'
import { resolve } from 'node:path'
import * as src from '@/lib/email-templates'

// Behavioral drift guard.
//
// The `process-notifications` Supabase edge function ships a Deno copy of the
// email templates at
// `supabase/functions/process-notifications/_shared/email-templates.ts`. That
// copy MUST render identically to `src/lib/email-templates.ts` — the only
// intended difference is the `SITE_URL` accessor (`Deno.env` vs `process.env`).
// If a future edit to one copy is not mirrored to the other, patients receive a
// different email than the app previews. This test fails CI when the two drift.
//
// The Deno copy is imported via a runtime-resolved (non-literal) specifier so
// `tsc --noEmit` does not pull the un-typed `Deno.env` module into the program.

/* eslint-disable @typescript-eslint/no-explicit-any */
let edge: any

const SRC_SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'
const EDGE_SITE = 'https://dentalstory.ua' // Deno.env.get('SITE_URL') stubbed → undefined → default

type Rendered = { subject: string; html: string; text: string }

// Normalise away the (intentionally) environment-dependent site origin so the
// comparison targets the template logic itself, not the configured base URL.
function norm(e: Rendered, site: string): Rendered {
  const s = (v: string) => v.split(site).join('§SITE§')
  return { subject: s(e.subject), html: s(e.html), text: s(e.text) }
}

beforeAll(async () => {
  ;(globalThis as any).Deno = { env: { get: () => undefined } }
  // vitest runs from the repo root, so resolve the edge copy from cwd.
  const edgePath = resolve(
    process.cwd(),
    'supabase/functions/process-notifications/_shared/email-templates.ts'
  )
  edge = await import(/* @vite-ignore */ edgePath)
})

const bookingData = {
  patientName: 'Тарас',
  service: 'Професійна гігієна',
  date: '2026-07-20',
  time: '10:30:00',
  appointmentId: 'appt-1',
  doctorName: 'Ковальчук Микола',
}
const locales = ['uk', 'en', 'pl'] as const

describe('edge _shared/email-templates ↔ src/lib parity', () => {
  it('the Deno copy exports the 6 queue templates', () => {
    for (const fn of [
      'bookingConfirmationEmail',
      'appointmentReminderEmail',
      'appointmentCancellationEmail',
      'newBookingAdminEmail',
      'recallEmail',
      'reviewRequestEmail',
    ]) {
      expect(typeof edge[fn]).toBe('function')
    }
  })

  it.each(locales)('bookingConfirmationEmail identical (%s)', locale => {
    expect(
      norm(edge.bookingConfirmationEmail(bookingData, locale), EDGE_SITE)
    ).toEqual(norm(src.bookingConfirmationEmail(bookingData, locale), SRC_SITE))
  })

  it.each(locales)('appointmentReminderEmail identical (%s)', locale => {
    expect(
      norm(edge.appointmentReminderEmail(bookingData, locale), EDGE_SITE)
    ).toEqual(norm(src.appointmentReminderEmail(bookingData, locale), SRC_SITE))
  })

  it.each(locales)('appointmentCancellationEmail identical (%s)', locale => {
    const data = { ...bookingData, reason: 'Лікар захворів' }
    expect(
      norm(edge.appointmentCancellationEmail(data, locale), EDGE_SITE)
    ).toEqual(norm(src.appointmentCancellationEmail(data, locale), SRC_SITE))
  })

  it('newBookingAdminEmail identical', () => {
    const data = {
      patientName: 'Тарас',
      phone: '+380671234567',
      email: 'taras@example.com',
      service: 'Гігієна',
      date: '2026-07-20',
      time: '10:30:00',
      appointmentId: 'appt-1',
    }
    expect(norm(edge.newBookingAdminEmail(data), EDGE_SITE)).toEqual(
      norm(src.newBookingAdminEmail(data), SRC_SITE)
    )
  })

  it.each([1, 2, 3] as const)('recallEmail touch %i identical (uk)', touch => {
    expect(
      norm(edge.recallEmail({ patientName: 'Тарас', touch }, 'uk'), EDGE_SITE)
    ).toEqual(
      norm(src.recallEmail({ patientName: 'Тарас', touch }, 'uk'), SRC_SITE)
    )
  })

  it.each(locales)('reviewRequestEmail identical (%s)', locale => {
    expect(
      norm(edge.reviewRequestEmail({ patientName: 'Тарас' }, locale), EDGE_SITE)
    ).toEqual(
      norm(src.reviewRequestEmail({ patientName: 'Тарас' }, locale), SRC_SITE)
    )
  })
})
