import type { Metadata, Viewport } from 'next'
import { Nunito, Rubik } from 'next/font/google'
import Script from 'next/script'
import { headers } from 'next/headers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ConsentGateAnalytics from '@/components/ConsentGateAnalytics'
import '../src/styles/globals.css'
import ClientProviders from './providers'
import Header from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import SidebarNav from '@/components/SidebarNav'
import ClientFloatingButtons from '@/components/ClientFloatingButtons'
import CookieConsent from '@/components/CookieConsent'
import { StructuredData } from '@/components/StructuredData'
import { getReviewStats } from '@/lib/review-stats'
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
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalstory.ua'
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
    url: 'https://dentalstory.ua/',
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      {
        url: '/assets/images/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/assets/images/favicon/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/assets/images/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
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
  const reviewStats = await getReviewStats()

  return (
    <html
      lang="uk"
      className={`${nunito.variable} ${rubik.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        {/* Organization JSON-LD structured data (server-rendered) */}
        <StructuredData type="organization" />
        <StructuredData
          type="localBusiness"
          rating={reviewStats.rating}
          reviewCount={reviewStats.reviewCount}
        />
        {/* Спеціалізована розмітка Dentist/MedicalClinic — компонент її
            підтримував, але ніде не рендерив (витягнуто з PR #340). */}
        <StructuredData type="medicalClinic" />

        {/* GA4 Consent Mode — must run before gtag loads so analytics_storage
            defaults to denied until the user explicitly accepts cookies. */}
        {GA4_ID && (
          <Script
            id="ga4-consent-default"
            strategy="beforeInteractive"
            nonce={nonce}
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                wait_for_update: 500
              });
            `}
          </Script>
        )}

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

        <div className="h-screen flex flex-col overflow-hidden">
          {/* Skip navigation link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-dental-teal text-white px-4 py-2 rounded-lg font-semibold focus:outline-hidden focus:ring-2 focus:ring-white"
          >
            {uk.accessibility.skipToContent}
          </a>
          <ClientProviders>
            <Header />
            <div className="flex flex-1 min-h-0 relative">
              <SidebarNav />
              <main
                id="main-content"
                className="flex-1 overflow-y-auto scroll-smooth"
                role="main"
              >
                {children}
                <Footer />
                {/* Fixed-positioned, but MUST live inside the <main> scroller:
                    touch scrolls that start on the banner chain up the DOM to
                    the nearest scrollable ancestor. Outside <main> that chain
                    ends at <body> (which never scrolls in this layout), making
                    the banner a scroll-dead zone on mobile. position:fixed
                    still positions it against the viewport from here. */}
                <CookieConsent />
              </main>
            </div>
            {/* Floating chat/messenger buttons — shown below xl, where the
                SidebarNav rail is hidden (2b/М5). The rail takes over at ≥1280px. */}
            <div className="xl:hidden">
              <ClientFloatingButtons />
            </div>
          </ClientProviders>
        </div>
        <ConsentGateAnalytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
