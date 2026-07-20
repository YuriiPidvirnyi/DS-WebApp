/**
 * Localized "N years of experience" label.
 *
 * English uses a simple singular/plural split; uk/pl use the Slavic mod10/mod100
 * CLDR buckets. i18next-native `count` plurals aren't usable here because uk/pl
 * need `_few`/`_many` keys English lacks, which would break the locale-parity
 * guard — hence this manual, locale-aware selection.
 */
export function experienceLabel(
  t: (key: string, opts?: Record<string, unknown>) => string,
  language: string,
  years: number
): string {
  if (language.startsWith('en')) {
    return years === 1
      ? t('about.experience.one', { years })
      : t('about.experience.many', { years })
  }
  const mod10 = years % 10
  const mod100 = years % 100
  if (mod100 >= 11 && mod100 <= 19) return t('about.experience.many', { years })
  if (mod10 === 1) return t('about.experience.one', { years })
  if (mod10 >= 2 && mod10 <= 4) return t('about.experience.few', { years })
  return t('about.experience.many', { years })
}
