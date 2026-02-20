import type { Metadata } from 'next'
import Gallery from '@/pages/Gallery'

export const metadata: Metadata = {
  title: 'Галерея — Dental Story',
  description:
    'Фото клініки, обладнання та результатів лікування. До/після згоди пацієнтів.',
  alternates: { canonical: '/gallery' },
}

export default function GalleryPage() {
  return <Gallery />
}
