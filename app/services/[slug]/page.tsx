import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceLanding, { type ServiceLandingSlug } from '@/views/ServiceLanding'
import { generateFAQSchema, generateBreadcrumbSchema } from '@/utils/seo'
import uk from '@/locales/uk'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'

const SLUGS: ServiceLandingSlug[] = ['implantation', 'aligners', 'veneers']

const ROUTE_META_KEY = {
  implantation: 'serviceImplantation',
  aligners: 'serviceAligners',
  veneers: 'serviceVeneers',
} as const

function isServiceSlug(slug: string): slug is ServiceLandingSlug {
  return (SLUGS as string[]).includes(slug)
}

export const dynamicParams = false

export function generateStaticParams() {
  return SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isServiceSlug(slug)) return {}
  const meta = uk.routeMeta[ROUTE_META_KEY[slug]]
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: meta.openGraphTitle,
      description: meta.openGraphDescription,
      url: `/services/${slug}`,
    },
  }
}

export default async function ServiceLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isServiceSlug(slug)) notFound()

  const meta = uk.routeMeta[ROUTE_META_KEY[slug]]
  const landing = uk.serviceLanding[slug]

  const faqSchema = generateFAQSchema(Object.values(landing.faq.items))

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: uk.navigation.home, url: `${BASE_URL}/` },
    { name: uk.routeMeta.services.breadcrumb, url: `${BASE_URL}/services` },
    { name: meta.breadcrumb, url: `${BASE_URL}/services/${slug}` },
  ])

  const procedureSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: landing.title,
    description: meta.description,
    url: `${BASE_URL}/services/${slug}`,
    provider: {
      '@type': 'Dentist',
      name: 'Dental Story',
      url: BASE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(procedureSchema) }}
      />
      <ServiceLanding slug={slug} />
    </>
  )
}
