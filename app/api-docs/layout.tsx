import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: `API Documentation — ${uk.common.brandName}`,
  robots: { index: false, follow: false },
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
