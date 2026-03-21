import type { Metadata } from 'next'
import Home from '@/views/Home'
import uk from '@/locales/uk'

const homeMeta = uk.routeMeta.home

export const metadata: Metadata = {
  title: homeMeta.title,
  description: homeMeta.description,
  keywords: homeMeta.keywords,
  alternates: { canonical: '/' },
  openGraph: {
    title: homeMeta.openGraphTitle,
    description: homeMeta.openGraphDescription,
    url: '/',
  },
}

export default function HomePage() {
  return <Home />
}
