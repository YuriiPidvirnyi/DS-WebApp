import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.appointmentsTitle,
  robots: { index: false, follow: false },
}

export default function CabinetAppointmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
