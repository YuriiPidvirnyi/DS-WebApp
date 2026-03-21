import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.signUpTitle,
  description: uk.routeMeta.auth.signUpDescription,
}

export default function AuthSignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
