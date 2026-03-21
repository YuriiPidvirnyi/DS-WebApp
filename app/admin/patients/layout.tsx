import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.admin.patientsTitle,
  robots: { index: false, follow: false },
}

export default function AdminPatientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
