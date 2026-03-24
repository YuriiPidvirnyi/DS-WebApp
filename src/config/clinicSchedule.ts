/**
 * Canonical clinic opening hours — single source of truth for UI, JSON-LD, SEO strings, and toasts.
 * Update here only; keep locale copy in uk/en/pl aligned with these values.
 */
export const CLINIC_OPENING_HOURS = {
  weekday: { open: '09:00', close: '20:00' },
  saturday: { open: '10:00', close: '18:00' },
  sunday: 'closed' as const,
} as const

/** Mo–Fr 09:00–20:00, Sa 10:00–18:00 — for schema.org / SEO helpers */
export function getOpeningHoursSchemaStrings(): string[] {
  const { weekday, saturday } = CLINIC_OPENING_HOURS
  return [
    `Mo-Fr ${weekday.open}-${weekday.close}`,
    `Sa ${saturday.open}-${saturday.close}`,
  ]
}
