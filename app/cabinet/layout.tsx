import type { Metadata } from 'next'
import uk from '@/locales/uk'
import CabinetLayoutClient from './CabinetLayoutClient'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.title,
  robots: { index: false, follow: false },
}

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CabinetLayoutClient>{children}</CabinetLayoutClient>
}
