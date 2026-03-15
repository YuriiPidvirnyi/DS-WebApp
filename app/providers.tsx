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
import { DragModeProvider } from '@/context/DragModeContext'

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
const DragModeToggle = dynamic(
  () => import('@/components/DragModeToggle'),
  { ssr: false }
)
const DraggableWrapper = dynamic(
  () => import('@/components/DraggableWrapper'),
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
          <DragModeProvider>
            <ToastProvider />
            <PerformanceMetrics />
            <ResourcePreloader />
            <LiveRegion />
            <SVGFilters />
            <DraggableWrapper
              storageKey="fab-accessibility"
              defaultPosition={{ x: 24, y: -1 }}
              label="Доступність"
              className="fixed bottom-44 left-6 z-40"
            >
              <AccessibilityPanel />
            </DraggableWrapper>
            <AppInitializer />
            {children}
            {/* Floating quick actions */}
            <DraggableWrapper
              storageKey="fab-quick-actions"
              defaultPosition={{ x: 24, y: -1 }}
              label="Швидкі дії"
              className="fixed bottom-56 left-6 z-50"
            >
              <FloatingQuickActions />
            </DraggableWrapper>
            {/* Drag mode toggle button */}
            <DragModeToggle />
          </DragModeProvider>
        </AccessibilityProvider>
      </ErrorBoundary>
    </I18nProvider>
  )
}
