import type { Metadata } from 'next'
import TermsOfService from '@/pages/TermsOfService'

export const metadata: Metadata = {
  title: 'Умови використання — Dental Story',
  description:
    'Правила користування веб-сайтом та надання стоматологічних послуг Dental Story.',
  alternates: { canonical: '/terms-of-service' },
}

export default function TermsOfServicePage() {
  return <TermsOfService />
}
