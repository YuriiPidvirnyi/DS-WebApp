import type { Metadata } from 'next'
import uk from '@/locales/uk'

const symptomCheckerMeta = uk.routeMeta.symptomChecker

export const metadata: Metadata = {
  title: symptomCheckerMeta.title,
  description: symptomCheckerMeta.description,
}

export default function SymptomCheckerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
