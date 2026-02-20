import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import '../src/styles/globals.css'

// Replace Google Fonts <link> from index.html with next/font for self-hosting
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.com.ua'
  ),
  title: {
    default: 'Dental Story - Сучасна стоматологічна клініка у Львові | Сумська, 10',
    template: '%s | Dental Story',
  },
  description:
    'Професійна стоматологічна клініка на вул. Сумська, 10. Повний спектр послуг: лікування, імплантація, ортодонтія. Безболісне лікування, сучасне обладнання. Запис 068 232 38 38',
  keywords:
    'стоматологія Львів, стоматолог Сумська, стоматологічна клініка Львів, лікування зубів, імплантація зубів, брекети, відбілювання зубів, Dental Story',
  authors: [{ name: 'Dental Story' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://dentalstory.com.ua/',
    title: 'Dental Story - Сучасна стоматологічна клініка у Львові',
    description:
      'Професійна стоматологічна клініка на вул. Сумська, 10. Безболісне лікування, сучасні технології. Запис: 068 232 38 38',
    images: [
      {
        url: '/assets/images/og/og-image.svg',
        width: 1200,
        height: 630,
        type: 'image/svg+xml',
        alt: 'Dental Story - Сучасна стоматологічна клініка у Львові',
      },
    ],
    locale: 'uk_UA',
    siteName: 'Dental Story',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dental Story - Сучасна стоматологічна клініка у Львові',
    description:
      'Професійна стоматологічна клініка на Сумська, 10. Безболісне лікування. Тел: 068 232 38 38',
    images: ['/assets/images/og/og-image.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" className={plusJakartaSans.variable}>
      <body>
        {/*
          TODO (Phase 2): Wrap with:
          - ErrorBoundary
          - AccessibilityProvider
          - ToastProvider
          - Header
          - main
          - Footer
          - StructuredData
          - GA4 script (next/script)
        */}
        {children}
      </body>
    </html>
  )
}
