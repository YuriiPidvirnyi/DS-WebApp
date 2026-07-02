import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'

/** Public pages available in uk (root), /en and /pl. */
const LOCALIZED_PAGES: Array<{
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/services', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/gallery', changeFrequency: 'weekly', priority: 0.6 },
]

/** uk-only pages (interactive flows and legal copy). */
const UK_ONLY_PAGES: Array<{
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
}> = [
  { path: '/booking', changeFrequency: 'daily', priority: 0.9 },
  { path: '/symptom-checker', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
]

function localizedUrls(path: string): Record<string, string> {
  const suffix = path === '/' ? '' : path
  return {
    uk: `${BASE_URL}${path}`,
    en: `${BASE_URL}/en${suffix}`,
    pl: `${BASE_URL}/pl${suffix}`,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const localized = LOCALIZED_PAGES.flatMap(
    ({ path, changeFrequency, priority }) => {
      const urls = localizedUrls(path)
      const alternates = { languages: { ...urls, 'x-default': urls.uk } }
      return [
        // uk at the root keeps full priority; en/pl slightly below
        { url: urls.uk, lastModified, changeFrequency, priority, alternates },
        {
          url: urls.en,
          lastModified,
          changeFrequency,
          priority: Math.max(priority - 0.1, 0.1),
          alternates,
        },
        {
          url: urls.pl,
          lastModified,
          changeFrequency,
          priority: Math.max(priority - 0.1, 0.1),
          alternates,
        },
      ]
    }
  )

  const ukOnly = UK_ONLY_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))

  // Note: /admin, /patient, /api are intentionally excluded from the sitemap.
  // /reviews was removed — it now permanently redirects to /.
  return [...localized, ...ukOnly]
}
