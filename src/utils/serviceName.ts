export interface LocalizedServiceNames {
  name_uk: string
  name_en?: string | null
  name_pl?: string | null
}

/**
 * Patient-facing localized service name. Services are entered Ukrainian-first
 * via the admin services editor; en/pl are optional, so fall back to the
 * Ukrainian name whenever the active language's translation is missing/empty.
 */
export function localizedServiceName(
  svc: LocalizedServiceNames | null | undefined,
  language: string,
  fallback = '—'
): string {
  if (!svc) return fallback
  const lang = language.slice(0, 2)
  if (lang === 'en' && svc.name_en?.trim()) return svc.name_en.trim()
  if (lang === 'pl' && svc.name_pl?.trim()) return svc.name_pl.trim()
  return svc.name_uk?.trim() || fallback
}
