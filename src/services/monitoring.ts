/**
 * Comprehensive monitoring and observability service
 */

interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface ErrorEvent {
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  timestamp: number
  context?: Record<string, unknown>
}

interface SessionReplayEvent {
  type: string
  data: unknown
  timestamp: number
}

class MonitoringService {
  private metrics: MetricData[] = []
  private errors: ErrorEvent[] = []
  private sessionEvents: SessionReplayEvent[] = []
  private readonly MAX_STORED_METRICS = 1000
  private readonly MAX_STORED_ERRORS = 100
  private readonly MAX_SESSION_EVENTS = 500

  // Performance Monitoring
  trackMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    }

    this.metrics.push(metric)

    if (this.metrics.length > this.MAX_STORED_METRICS) {
      this.metrics.shift()
    }

    // Send to analytics endpoint
    this.sendToEndpoint('/metrics', metric)
  }

  trackTiming(
    name: string,
    duration: number,
    tags?: Record<string, string>
  ): void {
    this.trackMetric(`timing.${name}`, duration, tags)
  }

  trackCount(
    name: string,
    count: number = 1,
    tags?: Record<string, string>
  ): void {
    this.trackMetric(`count.${name}`, count, tags)
  }

  // Error Tracking
  trackError(
    error: Error | string,
    level: ErrorEvent['level'] = 'error',
    context?: Record<string, unknown>
  ): void {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      level,
      timestamp: Date.now(),
      context,
    }

    this.errors.push(errorEvent)

    if (this.errors.length > this.MAX_STORED_ERRORS) {
      this.errors.shift()
    }

    // Send to error tracking service
    this.sendToEndpoint('/errors', errorEvent)
  }

  // Session Replay
  recordSessionEvent(type: string, data: unknown): void {
    const event: SessionReplayEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    this.sessionEvents.push(event)

    if (this.sessionEvents.length > this.MAX_SESSION_EVENTS) {
      this.sessionEvents.shift()
    }
  }

  startSessionRecording(): void {
    // Track clicks
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement
      this.recordSessionEvent('click', {
        tag: target.tagName,
        id: target.id,
        class: target.className,
        text: target.textContent?.slice(0, 50),
        x: e.clientX,
        y: e.clientY,
      })
    })

    // Track page views
    this.recordSessionEvent('pageview', {
      url: window.location.href,
      referrer: document.referrer,
    })

    // Track navigation
    window.addEventListener('popstate', () => {
      this.recordSessionEvent('navigation', {
        url: window.location.href,
      })
    })

    // Track errors
    window.addEventListener('error', e => {
      this.trackError(e.error || e.message, 'error', {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', e => {
      this.trackError(
        e.reason instanceof Error ? e.reason : String(e.reason),
        'error',
        { type: 'unhandledRejection' }
      )
    })
  }

  getSessionReplay(): SessionReplayEvent[] {
    return [...this.sessionEvents]
  }

  // Metrics Aggregation
  getMetrics(filter?: { name?: string; since?: number }): MetricData[] {
    let filtered = [...this.metrics]

    if (filter?.name) {
      filtered = filtered.filter(m => m.name.includes(filter.name!))
    }

    if (filter?.since) {
      filtered = filtered.filter(m => m.timestamp >= filter.since!)
    }

    return filtered
  }

  getAggregatedMetrics(
    name: string,
    since?: number
  ): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
  } {
    const metrics = this.getMetrics({ name, since })

    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  // Error Statistics
  getErrors(filter?: {
    level?: ErrorEvent['level']
    since?: number
  }): ErrorEvent[] {
    let filtered = [...this.errors]

    if (filter?.level) {
      filtered = filtered.filter(e => e.level === filter.level)
    }

    if (filter?.since) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!)
    }

    return filtered
  }

  getErrorRate(windowMs: number = 60000): number {
    const since = Date.now() - windowMs
    const errors = this.getErrors({ since })
    return errors.length / (windowMs / 1000) // errors per second
  }

  // Performance Monitoring
  measurePerformance(): {
    fcp: number | null
    lcp: number | null
    fid: number | null
    cls: number | null
    ttfb: number | null
  } {
    const perf = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming

    return {
      fcp: this.getFCP(),
      lcp: this.getLCP(),
      fid: this.getFID(),
      cls: this.getCLS(),
      ttfb: perf ? perf.responseStart - perf.requestStart : null,
    }
  }

  private getFCP(): number | null {
    const entries = performance.getEntriesByName('first-contentful-paint')
    return entries.length > 0 ? entries[0].startTime : null
  }

  private getLCP(): number | null {
    // This is simplified - in production, use web-vitals library
    const entries = performance.getEntriesByType('largest-contentful-paint')
    return entries.length > 0 ? entries[entries.length - 1].startTime : null
  }

  private getFID(): number | null {
    const entries = performance.getEntriesByType('first-input')
    return entries.length > 0
      ? (entries[0] as PerformanceEventTiming).processingStart -
          entries[0].startTime
      : null
  }

  private getCLS(): number | null {
    // This is simplified - in production, use web-vitals library
    let cls = 0
    const entries = performance.getEntriesByType(
      'layout-shift'
    ) as LayoutShift[]

    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        cls += entry.value
      }
    })

    return cls
  }

  // Health Check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: {
      errorRate: number
      avgResponseTime: number
      memoryUsage: number
    }
  } {
    const errorRate = this.getErrorRate(60000)
    const responseTimeMetrics = this.getAggregatedMetrics(
      'timing.api',
      Date.now() - 300000
    )

    // @ts-expect-error - performance.memory is Chrome-specific extension
    const memoryUsage = performance.memory
      ? // @ts-expect-error - usedJSHeapSize is Chrome-specific
        (performance.memory.usedJSHeapSize /
          performance.memory.jsHeapSizeLimit) *
        100
      : 0

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (errorRate > 0.1 || responseTimeMetrics.avg > 1000 || memoryUsage > 90) {
      status = 'unhealthy'
    } else if (
      errorRate > 0.05 ||
      responseTimeMetrics.avg > 500 ||
      memoryUsage > 75
    ) {
      status = 'degraded'
    }

    return {
      status,
      metrics: {
        errorRate,
        avgResponseTime: responseTimeMetrics.avg,
        memoryUsage,
      },
    }
  }

  // Send data to backend
  private async sendToEndpoint(endpoint: string, data: unknown): Promise<void> {
    if (!import.meta.env.VITE_MONITORING_ENDPOINT) return

    try {
      await fetch(`${import.meta.env.VITE_MONITORING_ENDPOINT}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        // Don't wait for response
        keepalive: true,
      })
    } catch (error) {
      // Silently fail - don't want monitoring to break the app
      console.warn('Failed to send monitoring data:', error)
    }
  }

  // Export data for debugging
  exportData(): {
    metrics: MetricData[]
    errors: ErrorEvent[]
    sessionEvents: SessionReplayEvent[]
    health: ReturnType<MonitoringService['getHealthStatus']>
  } {
    return {
      metrics: this.getMetrics(),
      errors: this.getErrors(),
      sessionEvents: this.getSessionReplay(),
      health: this.getHealthStatus(),
    }
  }

  // Clear all data
  clear(): void {
    this.metrics = []
    this.errors = []
    this.sessionEvents = []
  }
}

export const monitoring = new MonitoringService()

// Initialize session recording in production
if (import.meta.env.PROD) {
  monitoring.startSessionRecording()
}
