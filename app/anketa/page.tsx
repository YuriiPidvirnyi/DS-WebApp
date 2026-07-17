import { Suspense } from 'react'
import type { Metadata } from 'next'
import Anketa from '@/views/Anketa'
import uk from '@/locales/uk'

const anketaMeta = uk.routeMeta.anketa

export const metadata: Metadata = {
  title: anketaMeta.title,
  description: anketaMeta.description,
  alternates: { canonical: '/anketa' },
  openGraph: {
    title: anketaMeta.title,
    description: anketaMeta.description,
    url: '/anketa',
  },
}

export default function AnketaPage() {
  return (
    <Suspense fallback={null}>
      <Anketa />
    </Suspense>
  )
}
