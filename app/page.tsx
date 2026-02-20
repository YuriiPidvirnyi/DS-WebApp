import type { Metadata } from 'next'
import Home from '@/pages/Home'

export const metadata: Metadata = {
  title: 'Dental Story — Сучасна стоматологічна клініка в Львові',
  description:
    'Професійна стоматологія у Львові. Безболісне лікування зубів, імплантація, відбілювання. Досвідчені лікарі, сучасне обладнання.',
  keywords:
    'стоматологія львів, лікування зубів, імплантація, відбілювання зубів, dental story',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Dental Story — Сучасна стоматологічна клініка у Львові',
    description:
      'Професійна стоматологія у Львові. Безболісне лікування зубів, імплантація, відбілювання.',
    url: '/',
  },
}

export default function HomePage() {
  return <Home />
}
