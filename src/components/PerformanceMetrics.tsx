'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

// Interface for web vitals metrics
interface WebVitalsMetric {
  id: string
  name: string
  value: number
}

// This component silently monitors performance metrics
export default function PerformanceMetrics() {
  const pathname = usePathname()

  const reportWebVitals = useCallback(async (metric: WebVitalsMetric) => {
    // Log to console in development (only poor metrics)
    if (process.env.NODE_ENV !== "production") {
      const thresholds: Record<string, number> = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        FCP: 1800,
        TTFB: 5000, // Higher threshold for dev/test server (already inside non-production block)
        INP: 200,
      }
      const threshold = thresholds[metric.name]
      if (threshold && metric.value > threshold * 1.5) {
        console.warn(
          `⚠️ Poor ${metric.name}: ${metric.value.toFixed(0)}ms`,
          metric
        )
      }
    }

    // In production, we would send to analytics service
    // Example: sending to Google Analytics
    if (process.env.NODE_ENV === "production") {
      // Check if analytics is available
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.value),
          metric_id: metric.id,
          metric_name: metric.name,
          metric_value: metric.value,
          non_interaction: true,
        })
      }

      // Could also send to other services like Sentry or custom backend
      // try {
      //   await fetch('/api/metrics', {
      //     method: 'POST',
      //     body: JSON.stringify(metric),
      //     headers: { 'Content-Type': 'application/json' }
      //   })
      // } catch (error) {
      //   console.error('Failed to report web vital', error)
      // }
    }
  }, [])

  useEffect(() => {
    // Dynamically import web vitals (only used in client)
    const registerWebVitals = async () => {
      try {
        interface NetworkInformation {
          saveData?: boolean
        }
        const connection = (
          navigator as Navigator & { connection?: NetworkInformation }
        ).connection
        if (connection?.saveData) {
          return // Don't measure for users with saveData enabled
        }

        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import(
          'web-vitals'
        )
        onCLS(reportWebVitals)
        onINP(reportWebVitals)
        onLCP(reportWebVitals)
        onFCP(reportWebVitals)
        onTTFB(reportWebVitals)
      } catch (error) {
        console.error('Failed to register web vitals', error)
      }
    }

    registerWebVitals()
  }, [pathname, reportWebVitals]) // Re-measure on route changes

  return null // This component doesn't render anything
}

// We don't need to redeclare gtag here as it's already declared in analytics.ts
