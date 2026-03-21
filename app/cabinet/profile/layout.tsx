import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.profileTitle,
  robots: { index: false, follow: false },
}

export default function CabinetProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
