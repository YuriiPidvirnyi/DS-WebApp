import type { Metadata } from 'next'
import PrivacyPolicy from '@/pages/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Політика конфіденційності — Dental Story',
  description:
    'Як ми збираємо, зберігаємо та обробляємо ваші персональні дані. Конфіденційність пацієнтів — наш пріоритет.',
  alternates: { canonical: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />
}
