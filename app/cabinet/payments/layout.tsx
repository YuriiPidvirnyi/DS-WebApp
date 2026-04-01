import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.cabinet.paymentsTitle,
  robots: { index: false, follow: false },
}

export default function CabinetPaymentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
