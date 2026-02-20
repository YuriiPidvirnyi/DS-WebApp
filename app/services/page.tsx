import type { Metadata } from 'next'
import Services from '@/pages/Services'

export const metadata: Metadata = {
  title: 'Послуги — Dental Story',
  description:
    'Терапевтична, хірургічна, ортопедична стоматологія, ортодонтія, естетика та дитяча стоматологія.',
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return <Services />
}
