import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.loginTitle,
  description: uk.routeMeta.auth.loginDescription,
}

export default function AuthLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
