'use client'

import { type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'

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
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false })
const ToastProvider = dynamic(
  () => import('@/components/providers/ToastProvider'),
  { ssr: false }
)
const LiveRegion = dynamic(() => import('@/components/ui/LiveRegion'), {
  ssr: false,
})
const AppInitializer = dynamic(() => import('./app-initializer'), {
  ssr: false,
})

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
        <div className="min-h-screen flex flex-col">{children}</div>
        <Footer />
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
