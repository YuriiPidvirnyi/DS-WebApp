import type { Metadata } from 'next'
import TermsOfService from '@/views/TermsOfService'
import uk from '@/locales/uk'

const termsMeta = uk.routeMeta.termsOfService

export const metadata: Metadata = {
  title: termsMeta.title,
  description: termsMeta.description,
  alternates: { canonical: '/terms-of-service' },
}

export default function TermsOfServicePage() {
  return <TermsOfService />
}
