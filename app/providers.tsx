'use client'

import { useEffect, type ReactNode } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import ToastProvider from '@/components/providers/ToastProvider'
import PerformanceMetrics from '@/components/PerformanceMetrics'
import ResourcePreloader from '@/components/ResourcePreloader'
import LiveRegion from '@/components/ui/LiveRegion'
import SVGFilters from '@/components/SVGFilters'
import { AccessibilityPanel } from '@/components/AccessibilityPanel'
import FloatingQuickActions from '@/components/FloatingQuickActions'
import useAnalytics from '@/hooks/useAnalytics'
import { useReminders } from '@/hooks/useReminders'
import { initializeAnalytics } from '@/utils/analytics'
import { initializeSentry } from '@/utils/sentry'

/** Initializes analytics, Sentry and registers page-view tracking */
function AppInitializer() {
  useAnalytics()
  useReminders()

  useEffect(() => {
    const init = async () => {
      try {
        initializeAnalytics()
        if (process.env.NODE_ENV === 'production') {
          await initializeSentry()
        }
      } catch (err) {
        console.warn('Failed to init analytics/sentry:', err)
      }
    }
    init()
  }, [])

  return null
}

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ToastProvider />
        <PerformanceMetrics />
        <ResourcePreloader />
        <LiveRegion />
        <SVGFilters />
        <AccessibilityPanel />
        <AppInitializer />
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        {/* Floating quick actions rendered outside main flow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="pointer-events-auto">
            <FloatingQuickActions />
          </div>
        </div>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}
