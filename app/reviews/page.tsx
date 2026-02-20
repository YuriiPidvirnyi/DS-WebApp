import type { Metadata } from 'next'
import Reviews from '@/pages/Reviews'

export const metadata: Metadata = {
  title: 'Відгуки пацієнтів — Dental Story',
  description:
    'Оцініть наш сервіс та прочитайте відгуки пацієнтів про лікування у Dental Story.',
  alternates: { canonical: '/reviews' },
}

export default function ReviewsPage() {
  return <Reviews />
}
