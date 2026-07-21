import { CLINIC_OPENING_HOURS } from '@/config/clinicSchedule'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import uk from '@/locales/uk'

interface StructuredDataProps {
  // 'service' used to sit in this union with no switch case behind it —
  // it silently rendered the Organization schema; dropped as dead API
  type?: 'organization' | 'localBusiness' | 'medicalClinic'
  data?: Record<string, unknown>
  rating?: number
  reviewCount?: number
}

export const StructuredData = ({
  type = 'organization',
  rating,
  reviewCount,
}: StructuredDataProps) => {
  const schemaCopy = uk.structuredData

  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_INFO.name,
    alternateName: `${schemaCopy.organizationAlternateName} ${SITE_INFO.name}`,
    url: SITE_INFO.url,
    logo: `${SITE_INFO.url}/assets/images/favicon/favicon-32x32.png`,
    description: SITE_INFO.description,
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT_INFO.address.street,
      addressLocality: CONTACT_INFO.address.city,
      addressRegion: CONTACT_INFO.address.district,
      postalCode: CONTACT_INFO.address.postalCode,
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: String(CONTACT_INFO.coordinates.lat),
      longitude: String(CONTACT_INFO.coordinates.lng),
    },
    sameAs: [
      CONTACT_INFO.social.instagram,
      CONTACT_INFO.social.facebook,
      CONTACT_INFO.social.telegram,
      CONTACT_INFO.social.tiktok,
    ],
  })

  const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_INFO.url}/#localbusiness`,
    name: SITE_INFO.name,
    image: `${SITE_INFO.url}/assets/images/og/og-image.svg`,
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT_INFO.address.street,
      addressLocality: CONTACT_INFO.address.city,
      addressRegion: CONTACT_INFO.address.district,
      postalCode: CONTACT_INFO.address.postalCode,
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: String(CONTACT_INFO.coordinates.lat),
      longitude: String(CONTACT_INFO.coordinates.lng),
    },
    url: SITE_INFO.url,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: CLINIC_OPENING_HOURS.weekday.open,
        closes: CLINIC_OPENING_HOURS.weekday.close,
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: CLINIC_OPENING_HOURS.saturday.open,
        closes: CLINIC_OPENING_HOURS.saturday.close,
      },
    ],
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(rating ?? SITE_INFO.rating),
      reviewCount: String(reviewCount ?? SITE_INFO.reviewCount),
      bestRating: '5',
      worstRating: '1',
    },
  })

  const getMedicalClinicSchema = () => ({
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'Dentist'],
    '@id': `${SITE_INFO.url}/#medicalclinic`,
    name: `${SITE_INFO.name} - ${schemaCopy.medicalClinicNameSuffix}`,
    description: SITE_INFO.description,
    image: `${SITE_INFO.url}/assets/images/og/og-image.svg`,
    medicalSpecialty: [
      'Dentistry',
      'Orthodontics',
      'Periodontics',
      'Endodontics',
      'Prosthodontics',
      'Oral Surgery',
    ],
    availableService: [
      {
        '@type': 'MedicalTherapy',
        name: schemaCopy.services.therapeutic.name,
        description: schemaCopy.services.therapeutic.description,
      },
      {
        '@type': 'MedicalProcedure',
        name: schemaCopy.services.implantation.name,
        description: schemaCopy.services.implantation.description,
      },
      {
        '@type': 'MedicalProcedure',
        name: schemaCopy.services.orthodontics.name,
        description: schemaCopy.services.orthodontics.description,
      },
    ],
    address: {
      '@type': 'PostalAddress',
      // street (not .full) — .full already embeds city+region, which
      // duplicated addressLocality; now consistent with the other blocks
      streetAddress: CONTACT_INFO.address.street,
      addressLocality: CONTACT_INFO.address.city,
      addressRegion: CONTACT_INFO.address.district,
      postalCode: CONTACT_INFO.address.postalCode,
      addressCountry: 'UA',
    },
    // geo kept consistent with the organization/localBusiness blocks; no
    // aggregateRating here on purpose — duplicating review markup across
    // entity blocks risks Google's review-snippet spam heuristics.
    geo: {
      '@type': 'GeoCoordinates',
      latitude: String(CONTACT_INFO.coordinates.lat),
      longitude: String(CONTACT_INFO.coordinates.lng),
    },
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    url: SITE_INFO.url,
  })

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return getOrganizationSchema()
      case 'localBusiness':
        return getLocalBusinessSchema()
      case 'medicalClinic':
        return getMedicalClinicSchema()
      default:
        return getOrganizationSchema()
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }}
    />
  )
}
