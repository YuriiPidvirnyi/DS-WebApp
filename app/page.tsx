import type { Metadata } from 'next'
import Home from '@/views/Home'
import RootAuthRedirect from '@/components/RootAuthRedirect'
import uk from '@/locales/uk'
import { getVariant } from '@/lib/ab-test'

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

export default async function HomePage() {
  const heroCTAVariant = await getVariant('hero-cta')
  return (
    <>
      <RootAuthRedirect />
      <Home heroCTAVariant={heroCTAVariant} />
    </>
  )
}
