import type { Metadata } from 'next'
import Home from '@/pages/Home'

export const metadata: Metadata = {
  title: 'Dental Story — Сучасна стоматологічна клініка в Києві',
  description:
    'Професійне лікування зубів, імплантація, ортодонтія, естетична стоматологія. Запис онлайн або телефоном.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <Home />
}
