import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// Interface for web vitals metrics
interface WebVitalsMetric {
  id: string
  name: string
  value: number
}

// This component silently monitors performance metrics
export default function PerformanceMetrics() {
  const location = useLocation()

  const reportWebVitals = useCallback(async (metric: WebVitalsMetric) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`Web Vital: ${metric.name}`, metric)
    }

    // In production, we would send to analytics service
    // Example: sending to Google Analytics
    if (import.meta.env.PROD) {
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
        if ('connection' in navigator && 
            (navigator.connection as any)?.saveData) {
          return // Don't measure for users with saveData enabled
        }

        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals')
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
  }, [location.pathname, reportWebVitals]) // Re-measure on route changes

  return null // This component doesn't render anything
}

// Add TypeScript interfaces for window globals
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, unknown>
    ) => void
  }
}