import type { Metadata } from 'next'
import uk from '@/locales/uk'

export const metadata: Metadata = {
  title: uk.routeMeta.auth.signUpSuccessTitle,
}

export default function SignUpSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
