/**
 * SEO utilities for structured data and meta tags
 * Note: sitemap and robots.txt are handled by app/sitemap.ts and app/robots.ts
 */
import { getOpeningHoursSchemaStrings } from '@/config/clinicSchedule'
import uk from '@/locales/uk'

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
    name: uk.common.brandName,
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
    openingHours: getOpeningHoursSchemaStrings(),
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
      name: uk.common.brandName,
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
    title: uk.routeMeta.home.title,
    description: uk.routeMeta.home.description,
    keywords: uk.routeMeta.home.keywords,
    ogImage: 'https://dentalstory.com.ua/og-home.jpg',
  },
  services: {
    title: uk.routeMeta.services.title,
    description: uk.routeMeta.services.description,
    keywords: uk.routeMeta.services.keywords,
    ogImage: 'https://dentalstory.com.ua/og-services.jpg',
  },
  booking: {
    title: uk.routeMeta.booking.title,
    description: uk.routeMeta.booking.description,
    keywords: uk.routeMeta.booking.keywords,
    ogImage: 'https://dentalstory.com.ua/og-booking.jpg',
  },
  about: {
    title: uk.routeMeta.about.title,
    description: uk.routeMeta.about.description,
    keywords: uk.routeMeta.about.keywords,
    ogImage: 'https://dentalstory.com.ua/og-about.jpg',
  },
  gallery: {
    title: uk.routeMeta.gallery.title,
    description: uk.routeMeta.gallery.description,
    keywords: uk.routeMeta.gallery.keywords,
    ogImage: 'https://dentalstory.com.ua/og-gallery.jpg',
  },
  contact: {
    title: uk.routeMeta.contact.title,
    description: uk.routeMeta.contact.description,
    keywords: uk.routeMeta.contact.keywords,
    ogImage: 'https://dentalstory.com.ua/og-contact.jpg',
  },
}
