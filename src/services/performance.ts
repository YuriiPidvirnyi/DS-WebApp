import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals'

// Google Analytics types
declare global {
  function gtag(...args: unknown[]): void
}

interface PerformanceConfig {
  analyticsEndpoint?: string
  enableLogging?: boolean
  sampleRate?: number
  environment?: 'development' | 'staging' | 'production'
}

class PerformanceMonitor {
  private config: PerformanceConfig
  private metrics: Map<string, Metric> = new Map()
  private thresholds = {
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  }

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableLogging: config.environment === 'development',
      sampleRate: 1.0,
      environment: 'production',
      ...config,
    }
  }

  init() {
    if (!this.shouldTrack()) return

    // Core Web Vitals
    onLCP(this.handleMetric.bind(this))
    onCLS(this.handleMetric.bind(this))

    // Additional metrics
    onFCP(this.handleMetric.bind(this))
    onTTFB(this.handleMetric.bind(this))
    onINP(this.handleMetric.bind(this))

    // Track page load performance
    this.trackPageLoadPerformance()

    // Track resource timing
    this.trackResourceTiming()

    // Monitor long tasks
    this.monitorLongTasks()
  }

  private shouldTrack(): boolean {
    return Math.random() < (this.config.sampleRate || 1)
  }

  private handleMetric(metric: Metric) {
    this.metrics.set(metric.name, metric)

    const rating = this.getRating(metric)
    const data = {
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: (metric as any).navigationType,
      timestamp: Date.now(),
      environment: this.config.environment,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    if (this.config.enableLogging) {
      this.logMetric(data)
    }

    this.sendToAnalytics(data)
    this.checkThreshold(metric, rating)
  }

  private getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const threshold =
      this.thresholds[metric.name as keyof typeof this.thresholds]
    if (!threshold) return 'good'

    if (metric.value <= threshold.good) return 'good'
    if (metric.value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private logMetric(data: any) {
    const emoji =
      data.rating === 'good'
        ? '✅'
        : data.rating === 'needs-improvement'
          ? '⚠️'
          : '❌'
    console.log(
      `%c${emoji} ${data.name}`,
      `color: ${data.rating === 'good' ? 'green' : data.rating === 'needs-improvement' ? 'orange' : 'red'}; font-weight: bold;`,
      `${data.value.toFixed(2)}ms`,
      `(${data.rating})`
    )
  }

  private sendToAnalytics(data: any) {
    if (!this.config.analyticsEndpoint) return

    // Send to analytics endpoint
    fetch(this.config.analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(error => {
      if (this.config.enableLogging) {
        console.error('Failed to send performance metrics:', error)
      }
    })

    // Also send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: data.name,
        value: Math.round(data.value),
        metric_rating: data.rating,
        non_interaction: true,
      })
    }
  }

  private checkThreshold(
    metric: Metric,
    rating: 'good' | 'needs-improvement' | 'poor'
  ) {
    if (rating === 'poor') {
      // Alert for poor performance
      console.warn(`Poor ${metric.name} performance detected:`, metric.value)

      // Could trigger alerts or notifications
      if (this.config.environment === 'production') {
        this.notifyPoorPerformance(metric)
      }
    }
  }

  private notifyPoorPerformance(metric: Metric) {
    // Integration with error tracking
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureMessage(
        `Poor ${metric.name} performance: ${metric.value}ms`,
        'warning'
      )
    }
  }

  private trackPageLoadPerformance() {
    if (!window.performance || !window.performance.timing) return

    window.addEventListener('load', () => {
      const timing = window.performance.timing
      const navigation = window.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      const pageLoadMetrics = {
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        pageLoad: timing.loadEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        serverResponseTime:
          navigation?.responseStart - navigation?.requestStart,
        transferSize: navigation?.transferSize || 0,
        encodedBodySize: navigation?.encodedBodySize || 0,
        decodedBodySize: navigation?.decodedBodySize || 0,
      }

      if (this.config.enableLogging) {
        console.table(pageLoadMetrics)
      }

      this.sendToAnalytics({
        name: 'page_load_metrics',
        ...pageLoadMetrics,
        timestamp: Date.now(),
        environment: this.config.environment,
        url: window.location.href,
      })
    })
  }

  private trackResourceTiming() {
    if (!window.PerformanceObserver) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()

      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming

          // Track slow resources
          if (resource.duration > 1000) {
            const resourceData = {
              name: 'slow_resource',
              url: resource.name,
              duration: resource.duration,
              transferSize: resource.transferSize || 0,
              resourceType: resource.initiatorType,
              timestamp: Date.now(),
            }

            if (this.config.enableLogging) {
              console.warn('Slow resource detected:', resourceData)
            }

            this.sendToAnalytics(resourceData)
          }
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private monitorLongTasks() {
    if (!window.PerformanceObserver) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()

      entries.forEach(entry => {
        if (entry.duration > 50) {
          const taskData = {
            name: 'long_task',
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now(),
            environment: this.config.environment,
          }

          if (this.config.enableLogging) {
            console.warn('Long task detected:', taskData)
          }

          this.sendToAnalytics(taskData)
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // Long task observer not supported
      if (this.config.enableLogging) {
        console.log('Long task observer not supported')
      }
    }
  }

  public getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  public clearMetrics() {
    this.metrics.clear()
  }

  public generateReport() {
    const metrics = this.getMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: Object.entries(metrics).map(([name, metric]) => ({
        name,
        value: metric.value,
        rating: this.getRating(metric),
        delta: metric.delta,
      })),
    }

    return report
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor({
  environment: import.meta.env.MODE as any,
  enableLogging: import.meta.env.DEV,
  sampleRate: import.meta.env.DEV ? 1.0 : 0.1,
})

export default performanceMonitor
export { PerformanceMonitor }
