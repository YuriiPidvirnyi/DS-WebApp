/**
 * hreflang alternates for public localized pages.
 *
 * Ukrainian lives at the URL root (no /uk prefix — preserves all indexed
 * URLs); English and Polish live under /en and /pl. x-default points to the
 * Ukrainian version.
 *
 * @param path uk-root path starting with '/', e.g. '/' or '/services'
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const suffix = path === '/' ? '' : path
  return {
    uk: path,
    en: `/en${suffix}`,
    pl: `/pl${suffix}`,
    'x-default': path,
  }
}

/** OpenGraph locale identifiers per supported language. */
export const OG_LOCALE: Record<'uk' | 'en' | 'pl', string> = {
  uk: 'uk_UA',
  en: 'en_US',
  pl: 'pl_PL',
}
