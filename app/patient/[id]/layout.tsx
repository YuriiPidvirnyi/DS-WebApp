import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.patientCard.title,
  robots: { index: false, follow: false },
}

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
