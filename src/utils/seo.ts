/**
 * SEO utilities for structured data, meta tags, and sitemap generation
 */

export interface Organization {
  '@context': string
  '@type': string
  name: string
  url: string
  logo: string
  telephone: string
  email: string
  address: {
    '@type': string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo: {
    '@type': string
    latitude: number
    longitude: number
  }
  openingHours: string[]
  priceRange: string
  sameAs: string[]
}

export interface MedicalBusiness extends Organization {
  '@type': 'Dentist' | 'MedicalBusiness'
  medicalSpecialty: string[]
  acceptedPaymentMethod: string[]
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
    bestRating: number
    worstRating: number
  }
}

export interface Service {
  '@context': string
  '@type': string
  serviceType: string
  provider: {
    '@type': string
    name: string
  }
  description: string
  offers: {
    '@type': string
    price: string
    priceCurrency: string
  }
}

/**
 * Generate Organization schema (JSON-LD)
 */
export function generateOrganizationSchema(): MedicalBusiness {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: 'Dental Story',
    url: 'https://dentalstory.com.ua',
    logo: 'https://dentalstory.com.ua/logo.png',
    telephone: '+380XXXXXXXXX',
    email: 'info@dentalstory.com.ua',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'вул. Прикладна, 1',
      addressLocality: 'Київ',
      addressRegion: 'Київська область',
      postalCode: '01001',
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 50.4501,
      longitude: 30.5234,
    },
    openingHours: ['Mo-Fr 09:00-20:00', 'Sa 10:00-18:00'],
    priceRange: '₴₴',
    medicalSpecialty: [
      'Dental Care',
      'Orthodontics',
      'Cosmetic Dentistry',
      'Pediatric Dentistry',
      'Implantology',
    ],
    acceptedPaymentMethod: ['Cash', 'CreditCard', 'BankTransfer'],
    sameAs: [
      'https://www.facebook.com/dentalstory',
      'https://www.instagram.com/dentalstory',
      'https://www.linkedin.com/company/dentalstory',
    ],
  }
}

/**
 * Generate Service schema
 */
export function generateServiceSchema(
  serviceType: string,
  description: string,
  price: string
): Service {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    serviceType,
    provider: {
      '@type': 'Dentist',
      name: 'Dental Story',
    },
    description,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'UAH',
    },
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Inject JSON-LD script into head
 */
export function injectStructuredData(schema: Record<string, unknown>): void {
  if (typeof document === 'undefined') return

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  document.head.appendChild(script)
}

/**
 * Generate sitemap URLs
 */
export interface SitemapURL {
  loc: string
  lastmod?: string
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority?: number
}

export function generateSitemap(): SitemapURL[] {
  const baseUrl = 'https://dentalstory.com.ua'
  const now = new Date().toISOString().split('T')[0]

  return [
    {
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/services`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/booking`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/gallery`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/reviews`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.7,
    },
  ]
}

/**
 * Generate sitemap XML
 */
export function generateSitemapXML(urls: SitemapURL[]): string {
  const urlsXML = urls
    .map(
      url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXML}
</urlset>`
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://dentalstory.com.ua/sitemap.xml

# Disallow paths
Disallow: /admin
Disallow: /api
Disallow: /*.json$
Disallow: /*?*

# Crawl-delay
Crawl-delay: 1`
}

/**
 * Meta tags configuration
 */
export interface MetaTags {
  title: string
  description: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  canonical?: string
}

export function generateMetaTags(meta: MetaTags): Record<string, string> {
  const tags: Record<string, string> = {
    title: meta.title,
    description: meta.description,
    'og:title': meta.ogTitle || meta.title,
    'og:description': meta.ogDescription || meta.description,
    'og:type': meta.ogType || 'website',
    'og:url': meta.canonical || '',
    'twitter:card': meta.twitterCard || 'summary_large_image',
  }

  if (meta.keywords) {
    tags.keywords = meta.keywords
  }

  if (meta.ogImage) {
    tags['og:image'] = meta.ogImage
    tags['twitter:image'] = meta.ogImage
  }

  return tags
}

/**
 * Page-specific meta tags
 */
export const PAGE_META: Record<string, MetaTags> = {
  home: {
    title: 'Dental Story - Сучасна стоматологічна клініка в Києві',
    description:
      'Професійна стоматологія в Києві. Безболісне лікування зубів, імплантація, відбілювання. Досвідчені лікарі, сучасне обладнання.',
    keywords:
      'стоматологія київ, лікування зубів, імплантація, відбілювання зубів, dental story',
    ogImage: 'https://dentalstory.com.ua/og-home.jpg',
  },
  services: {
    title: 'Послуги стоматології Dental Story - Повний спектр',
    description:
      'Всі види стоматологічних послуг: терапія, ортопедія, імплантація, ортодонтія, дитяча стоматологія. Прозорі ціни.',
    keywords:
      'стоматологічні послуги, ціни на лікування зубів, імплантація зубів',
    ogImage: 'https://dentalstory.com.ua/og-services.jpg',
  },
  booking: {
    title: 'Онлайн запис до стоматолога - Dental Story',
    description:
      'Запишіться на прийом до стоматолога онлайн. Вибирайте зручний час та лікаря. Швидко та безпечно.',
    keywords: 'запис до стоматолога, онлайн запис, dental story київ',
    ogImage: 'https://dentalstory.com.ua/og-booking.jpg',
  },
  about: {
    title: 'Про нас - Dental Story Київ',
    description:
      'Dental Story - команда професіоналів з 10-річним досвідом. Сучасне обладнання, європейські стандарти лікування.',
    keywords: 'стоматологія київ про клініку, команда dental story',
    ogImage: 'https://dentalstory.com.ua/og-about.jpg',
  },
  gallery: {
    title: 'Галерея робіт - Результати лікування Dental Story',
    description:
      'Портфоліо наших робіт: фото до і після лікування. Імплантація, реставрація, відбілювання зубів.',
    keywords:
      'результати лікування зубів, фото до і після, dental story портфоліо',
    ogImage: 'https://dentalstory.com.ua/og-gallery.jpg',
  },
  contact: {
    title: 'Контакти - Dental Story Київ',
    description:
      'Адреса, телефон, години роботи стоматології Dental Story в Києві. Як нас знайти, карта проїзду.',
    keywords: 'dental story адреса, телефон стоматології, контакти київ',
    ogImage: 'https://dentalstory.com.ua/og-contact.jpg',
  },
}
