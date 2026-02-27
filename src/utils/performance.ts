/**
 * Performance monitoring and Core Web Vitals tracking
 */

import type { Metric } from 'web-vitals'

export interface PerformanceMetrics {
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number }
  fid: { good: number; needsImprovement: number }
  cls: { good: number; needsImprovement: number }
  fcp: { good: number; needsImprovement: number }
  ttfb: { good: number; needsImprovement: number }
  inp: { good: number; needsImprovement: number }
}

// Google's recommended thresholds
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = []

  constructor() {
    this.initWebVitals()
    this.initResourceTiming()
    this.initNavigationTiming()
  }

  private initWebVitals(): void {
    if (typeof window === 'undefined') return

    // Dynamic import for web-vitals
    import('web-vitals')
      .then(({ onCLS, onLCP, onFCP, onTTFB, onINP }) => {
        onLCP(this.handleMetric.bind(this), { reportAllChanges: false })
        onCLS(this.handleMetric.bind(this), { reportAllChanges: false })
        onFCP(this.handleMetric.bind(this), { reportAllChanges: false })
        onTTFB(this.handleMetric.bind(this), { reportAllChanges: false })
        onINP(this.handleMetric.bind(this), { reportAllChanges: false })
      })
      .catch(err => {
        console.warn('Failed to load web-vitals:', err)
      })
  }

  private handleMetric(metric: Metric): void {
    const key = metric.name.toLowerCase() as keyof PerformanceMetrics
    this.metrics[key] = metric.value

    // Log performance issues
    this.checkThreshold(metric)

    // Notify callbacks
    this.notifyCallbacks()
  }

  private checkThreshold(metric: Metric): void {
    const key = metric.name.toLowerCase() as keyof PerformanceThresholds
    const threshold = PERFORMANCE_THRESHOLDS[key]

    if (!threshold) return

    let rating: 'good' | 'needs-improvement' | 'poor'
    if (metric.value <= threshold.good) {
      rating = 'good'
    } else if (metric.value <= threshold.needsImprovement) {
      rating = 'needs-improvement'
    } else {
      rating = 'poor'
    }

    if (rating === 'poor') {
      console.warn(
        `[Performance] ${metric.name} is poor: ${metric.value.toFixed(2)}ms (threshold: ${threshold.needsImprovement}ms)`
      )
    }
  }

  private initResourceTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          // Log slow resources
          if (entry.duration > 1000) {
            console.warn(
              `[Performance] Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`
            )
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    } catch (err) {
      console.warn('Failed to observe resource timing:', err)
    }
  }

  private initNavigationTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('[Performance] Navigation timing:', {
                domContentLoaded:
                  navEntry.domContentLoadedEventEnd -
                  navEntry.domContentLoadedEventStart,
                domInteractive: navEntry.domInteractive - navEntry.fetchStart,
                loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
              })
            }
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })
      this.observers.push(observer)
    } catch (err) {
      console.warn('Failed to observe navigation timing:', err)
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback({ ...this.metrics })
      } catch (err) {
        console.error('Performance callback error:', err)
      }
    })
  }

  /**
   * Subscribe to performance metric updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(metrics: PerformanceMetrics = this.metrics): void {
    if (typeof window === 'undefined') return

    // Send to Google Analytics 4
    if ('gtag' in window && typeof window.gtag === 'function') {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          window.gtag('event', key, {
            value: Math.round(value),
            metric_id: key,
            metric_value: value,
            metric_delta: value,
          })
        }
      })
    }

    // Send to Vercel Analytics (if available)
    if ('webVitals' in window) {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          ;(
            window as {
              webVitals?: { track: (name: string, value: number) => void }
            }
          ).webVitals?.track(key, value)
        }
      })
    }
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.callbacks = []
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
import { useState, useEffect } from 'react'

export function usePerformanceMonitoring(
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(newMetrics => {
      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)
    })

    // Get initial metrics
    setMetrics(performanceMonitor.getMetrics())

    return unsubscribe
  }, [onMetricsUpdate])

  return metrics
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    img.src = img.dataset.src || ''
    return
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement
          image.src = image.dataset.src || ''
          image.classList.remove('lazy')
          observer.unobserve(image)
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  )

  observer.observe(img)
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as

  if (as === 'font') {
    link.crossOrigin = 'anonymous'
  }

  document.head.appendChild(link)
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchResource(href: string): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href

  document.head.appendChild(link)
}

/**
 * Mark navigation timing
 */
export function markPerformance(name: string): void {
  if (typeof window === 'undefined' || !('performance' in window)) return

  try {
    performance.mark(name)
  } catch (err) {
    console.warn('Failed to mark performance:', err)
  }
}

/**
 * Measure performance between marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window === 'undefined' || !('performance' in window)) return null

  try {
    performance.measure(name, startMark, endMark)
    const measures = performance.getEntriesByName(name, 'measure')
    return measures.length > 0 ? measures[0].duration : null
  } catch (err) {
    console.warn('Failed to measure performance:', err)
    return null
  }
}

/**
 * Report long tasks (> 50ms)
 */
export function reportLongTasks(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        console.warn(
          `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms at ${entry.startTime.toFixed(2)}ms`
        )

        // Send to analytics
        if ('gtag' in window && typeof window.gtag === 'function') {
          window.gtag('event', 'long_task', {
            value: Math.round(entry.duration),
            duration: entry.duration,
          })
        }
      })
    })

    observer.observe({ entryTypes: ['longtask'] })
  } catch (err) {
    console.warn('Failed to observe long tasks:', err)
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return

  // Report long tasks
  reportLongTasks()

  // Send metrics to analytics when page is about to unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      performanceMonitor.sendToAnalytics()
    }
  })

  // Cleanup on page unload
  window.addEventListener('pagehide', () => {
    performanceMonitor.disconnect()
  })
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load
  if (document.readyState === 'complete') {
    initPerformanceMonitoring()
  } else {
    window.addEventListener('load', initPerformanceMonitoring)
  }
}

// Type declarations for global objects
declare global {
  interface Window {
    webVitals?: {
      track: (name: string, value: number) => void
    }
  }
}
