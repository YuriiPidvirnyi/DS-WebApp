'use client'

import { type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import ToastProvider from '@/components/providers/ToastProvider'
import LiveRegion from '@/components/ui/LiveRegion'
import I18nProvider from './i18n-provider'
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
const AccessibilityPanel = dynamic(
  () =>
    import('@/components/AccessibilityPanel').then(m => ({
      default: m.AccessibilityPanel,
    })),
  { ssr: false }
)
const FloatingQuickActions = dynamic(
  () => import('@/components/FloatingQuickActions'),
  { ssr: false }
)

/** Initializes analytics, Sentry and registers page-view tracking */
function AppInitializer() {
  useAnalytics()
  useReminders()

  // GA4 is loaded via next/script in app/layout.tsx
  // Sentry is initialised via sentry.client.config.ts + instrumentation.ts

  return null
}

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <AccessibilityProvider>
          <ToastProvider />
          <PerformanceMetrics />
          <ResourcePreloader />
          <LiveRegion />
          <SVGFilters />
          <AccessibilityPanel />
          <AppInitializer />
          <div className="min-h-screen flex flex-col">{children}</div>
          {/* Floating quick actions - positioned without blocking scroll */}
          <FloatingQuickActions />
        </AccessibilityProvider>
      </ErrorBoundary>
    </I18nProvider>
  )
}
