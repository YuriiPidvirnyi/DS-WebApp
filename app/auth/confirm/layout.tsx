import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.resetPasswordTitle,
  description: uk.routeMeta.auth.resetPasswordDescription,
  robots: { index: false, follow: false },
}

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
