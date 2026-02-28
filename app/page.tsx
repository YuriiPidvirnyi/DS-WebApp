import type { Metadata } from 'next'
import Home from '@/views/Home'

export const metadata: Metadata = {
  title: 'Dental Story — Сучасна стоматологічна клініка у центрі Львова',
  description:
    'Професійна стоматологія у центрі Львова на вул. Дорошенка, 35. Безболісне лікування зубів, імплантація, ортодонтія, відбілювання. Досвідчені лікарі, сучасне обладнання. Безкоштовна консультація.',
  keywords:
    'стоматологія львів, лікування зубів, імплантація, відбілювання зубів, dental story, дорошенка, центр львова',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Dental Story — Сучасна стоматологічна клініка у Львові',
    description:
      'Професійна стоматологія у центрі Львова. Безболісне лікування, імплантація, ортодонтія. Безкоштовна консультація.',
    url: '/',
  },
}

export default function HomePage() {
  return <Home />
}
