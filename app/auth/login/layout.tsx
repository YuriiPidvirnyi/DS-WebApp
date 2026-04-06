import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.loginTitle,
  description: uk.routeMeta.auth.loginDescription,
  alternates: { canonical: '/auth/login' },
  openGraph: {
    title: uk.routeMeta.auth.loginTitle,
    description: uk.routeMeta.auth.loginDescription,
    url: '/auth/login',
  },
}

export default function AuthLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
