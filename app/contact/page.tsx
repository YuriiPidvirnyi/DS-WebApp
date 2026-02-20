import type { Metadata } from 'next'
import Contact from '@/pages/Contact'

export const metadata: Metadata = {
  title: 'Контакти — Dental Story',
  description:
    'Телефон, email, адреса та години роботи клініки. Швидкий зворотній дзвінок і карта Google.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return <Contact />
}
