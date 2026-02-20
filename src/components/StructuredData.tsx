import { Helmet } from 'react-helmet-async'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

interface StructuredDataProps {
  type?: 'organization' | 'localBusiness' | 'medicalClinic' | 'service'
  data?: Record<string, unknown>
}

export const StructuredData = ({
  type = 'organization',
}: StructuredDataProps) => {
  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_INFO.name,
    alternateName: `Стоматологічна клініка ${SITE_INFO.name}`,
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
      CONTACT_INFO.social.facebook,
      CONTACT_INFO.social.instagram,
      CONTACT_INFO.social.telegram,
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
        opens: '09:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '18:00',
      },
    ],
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(SITE_INFO.rating || '4.7'),
      reviewCount: String(SITE_INFO.reviewCount || '71'),
      bestRating: '5',
      worstRating: '1',
    },
  })

  const getMedicalClinicSchema = () => ({
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'Dentist'],
    '@id': `${SITE_INFO.url}/#medicalclinic`,
    name: `${SITE_INFO.name} - Стоматологічна Клініка`,
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
        name: 'Терапевтична стоматологія',
        description: 'Лікування карієсу, пульпіту, періодонтиту',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Імплантація зубів',
        description: 'Встановлення зубних імплантів',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Ортодонтія',
        description: 'Виправлення прикусу, встановлення брекетів',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT_INFO.address.full,
      addressLocality: CONTACT_INFO.address.city,
      postalCode: CONTACT_INFO.address.postalCode,
      addressCountry: 'UA',
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
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(getSchema())}</script>
    </Helmet>
  )
}
