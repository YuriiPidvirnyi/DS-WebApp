import type { Metadata } from 'next'
import NotFoundPage from '@/pages/NotFound'

export const metadata: Metadata = {
  title: '404 — Сторінку не знайдено | Dental Story',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundPage />
}
