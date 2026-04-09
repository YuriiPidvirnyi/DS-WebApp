import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.signUpTitle,
  description: uk.routeMeta.auth.signUpDescription,
  alternates: { canonical: '/auth/sign-up' },
  openGraph: {
    title: uk.routeMeta.auth.signUpTitle,
    description: uk.routeMeta.auth.signUpDescription,
    url: '/auth/sign-up',
  },
}

export default function AuthSignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
