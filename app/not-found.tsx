import type { Metadata } from 'next'
import NotFoundPage from '@/views/NotFound'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: `404 — ${uk.notFound.title} | ${uk.common.brandName}`,
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundPage />
}
