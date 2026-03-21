import type { Metadata } from 'next'
import PrivacyPolicy from '@/views/PrivacyPolicy'
import uk from '@/locales/uk'

const privacyMeta = uk.routeMeta.privacyPolicy

export const metadata: Metadata = {
  title: privacyMeta.title,
  description: privacyMeta.description,
  alternates: { canonical: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />
}
