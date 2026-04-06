import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.treatmentsTitle,
  robots: { index: false, follow: false },
}

export default function CabinetTreatmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
