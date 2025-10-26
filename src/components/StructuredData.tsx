import { Helmet } from 'react-helmet-async'

interface StructuredDataProps {
  type?: 'organization' | 'localBusiness' | 'medicalClinic' | 'service'
  data?: Record<string, unknown>
}

export const StructuredData = ({ type = 'organization' }: StructuredDataProps) => {
  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dental Story',
    alternateName: 'Стоматологічна клініка Dental Story',
    url: 'https://dentalstory.com.ua',
    logo: 'https://dentalstory.com.ua/assets/images/favicon/favicon-32x32.png',
    description: 'Сучасна стоматологічна клініка в Києві. Професійне лікування зубів, імплантація, протезування.',
    telephone: '+380504554774',
    email: 'info@dentalstory.com.ua',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'вул. Академіка Корольова, 10',
      addressLocality: 'Київ',
      addressRegion: 'Київська область',
      postalCode: '02660',
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '50.5147',
      longitude: '30.6348',
    },
    sameAs: [
      'https://facebook.com/dentalstory',
      'https://instagram.com/dentalstory',
      'https://t.me/dentalstory',
    ],
  })

  const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://dentalstory.com.ua/#localbusiness',
    name: 'Dental Story',
    image: 'https://dentalstory.com.ua/assets/images/og/og-image.svg',
    telephone: '+380504554774',
    email: 'info@dentalstory.com.ua',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'вул. Академіка Корольова, 10',
      addressLocality: 'Київ',
      addressRegion: 'Київська область',
      postalCode: '02660',
      addressCountry: 'UA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '50.5147',
      longitude: '30.6348',
    },
    url: 'https://dentalstory.com.ua',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '16:00',
      },
    ],
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  })

  const getMedicalClinicSchema = () => ({
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'Dentist'],
    '@id': 'https://dentalstory.com.ua/#medicalclinic',
    name: 'Dental Story - Стоматологічна Клініка',
    description: 'Сучасна стоматологічна клініка в Києві з новітнім обладнанням та досвідченими лікарями',
    image: 'https://dentalstory.com.ua/assets/images/og/og-image.svg',
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
      streetAddress: 'вул. Академіка Корольова, 10, Дніпровський район',
      addressLocality: 'Київ',
      postalCode: '02660',
      addressCountry: 'UA',
    },
    telephone: '+380504554774',
    email: 'info@dentalstory.com.ua',
    url: 'https://dentalstory.com.ua',
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
