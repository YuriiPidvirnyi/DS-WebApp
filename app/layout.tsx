import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import '../src/styles/globals.css'
import ClientProviders from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import AIAssistant from '@/components/AIAssistant'
import { StructuredData } from '@/components/StructuredData'

// Nunito - заокруглений шрифт, схожий на Stolzl з брендбуку (Dental Story brandbook)
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#AECED3',
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
      'Dental Story - Сучасна стоматологічна клініка у Львові | Сумська, 10',
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

const GA4_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read CSP nonce injected by middleware — makes this layout dynamically rendered
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="uk" className={nunito.variable} data-scroll-behavior="smooth">
      <body>
        {/* Organization JSON-LD structured data (server-rendered) */}
        <StructuredData type="organization" />
        <StructuredData type="localBusiness" />

        {/* Google Analytics 4 */}
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
          {/* Skip navigation link for accessibility - This is on layout level so not translated dynamically */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-dental-teal text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
          <Footer />
          <ChatWidget />
          <AIAssistant />
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  )
}
