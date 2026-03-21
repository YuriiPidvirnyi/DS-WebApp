import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.admin.loginTitle,
  robots: { index: false, follow: false },
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
