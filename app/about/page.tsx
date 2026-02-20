import type { Metadata } from 'next'
import About from '@/pages/About'

export const metadata: Metadata = {
  title: 'Про нас — Dental Story',
  description:
    'Сучасна стоматологічна клініка: досвідчена команда, інноваційне обладнання, турбота про пацієнтів.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <About />
}
