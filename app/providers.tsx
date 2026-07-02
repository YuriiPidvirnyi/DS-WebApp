'use client'

// Client-side providers for the application
import { type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import ToastProvider from '@/components/providers/ToastProvider'
import LiveRegion from '@/components/ui/LiveRegion'
import I18nProvider, { type SupportedLocale } from './i18n-provider'
import useAnalytics from '@/hooks/useAnalytics'
import { useReminders } from '@/hooks/useReminders'

// Lazy-load non-critical components to reduce TBT on initial page load
const PerformanceMetrics = dynamic(
  () => import('@/components/PerformanceMetrics'),
  { ssr: false }
)
const ResourcePreloader = dynamic(
  () => import('@/components/ResourcePreloader'),
  { ssr: false }
)
const SVGFilters = dynamic(() => import('@/components/SVGFilters'), {
  ssr: false,
})

/** Initializes analytics, Sentry and registers page-view tracking */
function AppInitializer() {
  useAnalytics()
  useReminders()

  // GA4 is loaded via next/script in app/layout.tsx
  // Sentry is initialised via sentry.client.config.ts + instrumentation.ts

  return null
}

interface ClientProvidersProps {
  locale?: SupportedLocale
  localeBundle?: Record<string, unknown> | null
  children: ReactNode
}

export default function ClientProviders({
  locale = 'uk',
  localeBundle = null,
  children,
}: ClientProvidersProps) {
  return (
    <I18nProvider locale={locale} localeBundle={localeBundle}>
      <ErrorBoundary>
        <AccessibilityProvider>
          <ToastProvider />
          <PerformanceMetrics />
          <ResourcePreloader />
          <LiveRegion />
          <SVGFilters />
          <AppInitializer />
          {children}
        </AccessibilityProvider>
      </ErrorBoundary>
    </I18nProvider>
  )
}
