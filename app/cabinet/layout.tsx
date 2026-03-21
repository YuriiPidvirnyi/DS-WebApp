import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.title,
  robots: { index: false, follow: false },
}

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
