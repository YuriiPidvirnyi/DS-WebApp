import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/react'
import '../src/styles/globals.css'
import ClientProviders from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ClientWidgets from '@/components/ClientWidgets'
import { StructuredData } from '@/components/StructuredData'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0D9488',
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.com.ua'
  ),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dental Story',
  },
  formatDetection: { telephone: false },
  title: {
    default:
      'Dental Story - Сучасна стоматологічна клініка у Львові | вул. Дорошенка, 35',
    template: '%s | Dental Story',
  },
  description:
    'Професійна стоматологічна клініка у центрі Львова на вул. Дорошенка, 35. Повний спектр послуг: лікування, імплантація, ортодонтія. Безболісне лікування, сучасне обладнання. Запис +380 68 232 38 38',
  keywords:
    'стоматологія Львів, стоматолог Дорошенка, стоматологічна клініка Львів, лікування зубів, імплантація зубів, брекети, відбілювання зубів, Dental Story',
  authors: [{ name: 'Dental Story' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://dentalstory.com.ua/',
    title: 'Dental Story - Сучасна стоматологічна клініка у Львові',
    description:
      'Професійна стоматологічна клініка у центрі Львова на вул. Дорошенка, 35. Безболісне лікування, сучасні технології. Запис: +380 68 232 38 38',
    images: [
      {
        url: '/images/hero-dental.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
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
      'Професійна стоматологічна клініка на вул. Дорошенка, 35. Безболісне лікування. Тел: +380 68 232 38 38',
    images: ['/images/hero-dental.jpg'],
  },
}

const GA4_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="uk" className={plusJakartaSans.variable}>
      <body className="font-sans antialiased">
        <StructuredData type="organization" />
        <StructuredData type="localBusiness" />

        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        <ClientProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
          <Footer />
          <ClientWidgets />
        </ClientProviders>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
