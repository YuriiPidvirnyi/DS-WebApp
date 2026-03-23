import type { Metadata, Viewport } from 'next'
import { Nunito, Rubik } from 'next/font/google'
import Script from 'next/script'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '../src/styles/globals.css'
import ClientProviders from './providers'
import Header from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import ClientFloatingButtons from '@/components/ClientFloatingButtons'
import CookieConsent from '@/components/CookieConsent'
import { StructuredData } from '@/components/StructuredData'
import uk from '@/locales/uk'

// Project typography system
// Nunito - rounded headings font.
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

// Rubik - soft rounded body font with full Cyrillic support.
const rubik = Rubik({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rubik',
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
    title: uk.common.brandName,
  },
  formatDetection: { telephone: false },
  title: {
    default: uk.meta.title,
    template: `%s | ${uk.common.brandName}`,
  },
  description: uk.meta.description,
  keywords: uk.meta.keywords,
  authors: [{ name: uk.common.brandName }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://dentalstory.com.ua/',
    title: uk.meta.openGraphTitle,
    description: uk.meta.openGraphDescription,
    images: [
      {
        url: '/assets/images/og/og-image.svg',
        width: 1200,
        height: 630,
        type: 'image/svg+xml',
        alt: uk.meta.ogImageAlt,
      },
    ],
    locale: 'uk_UA',
    siteName: uk.common.brandName,
  },
  twitter: {
    card: 'summary_large_image',
    title: uk.meta.twitterTitle,
    description: uk.meta.twitterDescription,
    images: ['/assets/images/og/og-image.svg'],
  },
}

const GA4_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read CSP nonce injected by root proxy (`proxy.ts`) — makes this layout dynamically rendered
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html
      lang="uk"
      className={`${nunito.variable} ${rubik.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        {/* Organization JSON-LD structured data (server-rendered) */}
        <StructuredData type="organization" />
        <StructuredData type="localBusiness" />

        {/* Google Analytics 4 — lazyOnload to avoid blocking hydration */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="lazyOnload"
              nonce={nonce}
            />
            <Script id="ga4-init" strategy="lazyOnload" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        <div className="min-h-screen min-w-0 flex flex-col overflow-x-clip">
          {/* Skip navigation link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-dental-teal text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
          >
            {uk.accessibility.skipToContent}
          </a>
          <ClientProviders>
            <Header />
            <main
              id="main-content"
              className="flex-1 pb-28 sm:pb-24 max-sm:pb-32"
              role="main"
            >
              {children}
            </main>
            <Footer />
            <ClientFloatingButtons />
            <CookieConsent />
          </ClientProviders>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
