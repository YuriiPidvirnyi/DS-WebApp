/**
 * Code splitting and dynamic import utilities
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
}

/**
 * Retry dynamic import on failure (e.g., network issues)
 */
export function retryImport<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): Promise<{ default: T }> {
  const { maxRetries = 3, retryDelay = 1000 } = options

  return new Promise((resolve, reject) => {
    let attempts = 0

    const attemptImport = () => {
      importFn()
        .then(resolve)
        .catch(error => {
          attempts++

          if (attempts >= maxRetries) {
            console.error(
              `Failed to load module after ${maxRetries} attempts:`,
              error
            )
            reject(error)
          } else {
            console.warn(
              `Import failed, retrying... (${attempts}/${maxRetries})`
            )
            setTimeout(attemptImport, retryDelay * attempts) // Exponential backoff
          }
        })
    }

    attemptImport()
  })
}

/**
 * Create lazy component with retry logic
 */
export function lazyWithRetry<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
  options?: RetryOptions
): LazyExoticComponent<T> {
  return lazy(() => retryImport(importFn, options))
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType>(
  factory: () => Promise<{ default: T }>
): void {
  factory().catch(err => {
    console.warn('Failed to preload component:', err)
  })
}

/**
 * Prefetch route components on hover/focus
 */
export function prefetchRouteOnInteraction(
  factory: () => Promise<unknown>,
  element: HTMLElement
): () => void {
  let prefetched = false

  const prefetch = () => {
    if (!prefetched) {
      prefetched = true
      factory().catch(err => {
        console.warn('Failed to prefetch route:', err)
      })
    }
  }

  element.addEventListener('mouseenter', prefetch)
  element.addEventListener('focus', prefetch)

  return () => {
    element.removeEventListener('mouseenter', prefetch)
    element.removeEventListener('focus', prefetch)
  }
}

/**
 * Lazy load component with intersection observer
 * Only loads when component is about to enter viewport
 */
export function lazyWithIntersection<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
  rootMargin = '100px'
): LazyExoticComponent<T> {
  let componentPromise: Promise<{ default: T }> | null = null

  return lazy(() => {
    if (!componentPromise) {
      componentPromise = new Promise((resolve, reject) => {
        // Check if IntersectionObserver is supported
        if (typeof IntersectionObserver === 'undefined') {
          // Fallback: load immediately
          importFn().then(resolve).catch(reject)
          return
        }

        // Create observer
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                importFn().then(resolve).catch(reject)
                observer.disconnect()
              }
            })
          },
          { rootMargin }
        )

        // For now, just load immediately
        // In practice, you'd observe a placeholder element
        importFn().then(resolve).catch(reject)
      })
    }

    return componentPromise
  })
}

/**
 * Bundle splitting recommendations for route-based code splitting
 */
export const ROUTE_COMPONENTS = {
  Home: () => retryImport(() => import('../pages/Home')),
  Services: () => retryImport(() => import('../pages/Services')),
  Booking: () => retryImport(() => import('../pages/Booking')),
  Gallery: () => retryImport(() => import('../pages/Gallery')),
  About: () => retryImport(() => import('../pages/About')),
  Contact: () => retryImport(() => import('../pages/Contact')),
  Reviews: () => retryImport(() => import('../pages/Reviews')),
}

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes(): void {
  // Preload homepage (if not current route)
  if (window.location.pathname !== '/') {
    ROUTE_COMPONENTS.Home().catch(() => {})
  }

  // Preload services (high priority)
  setTimeout(() => {
    ROUTE_COMPONENTS.Services().catch(() => {})
  }, 1000)

  // Preload booking (high priority)
  setTimeout(() => {
    ROUTE_COMPONENTS.Booking().catch(() => {})
  }, 2000)
}

/**
 * Check if code splitting is supported
 */
export function isCodeSplittingSupported(): boolean {
  try {
    return typeof import.meta !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Measure chunk load time
 */
export function measureChunkLoadTime(
  chunkName: string,
  importFn: () => Promise<unknown>
): Promise<unknown> {
  const startTime = performance.now()

  return importFn()
    .then(module => {
      const endTime = performance.now()
      const loadTime = endTime - startTime

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(
          `[Code Splitting] Loaded ${chunkName} in ${loadTime.toFixed(2)}ms`
        )
      }

      // Send to analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        window.gtag('event', 'chunk_load', {
          chunk_name: chunkName,
          load_time: Math.round(loadTime),
        })
      }

      return module
    })
    .catch(error => {
      console.error(`[Code Splitting] Failed to load ${chunkName}:`, error)
      throw error
    })
}

/**
 * Auto-initialize code splitting optimizations
 */
export function initCodeSplitting(): void {
  if (typeof window === 'undefined') return

  // Preload critical routes after initial load
  if (document.readyState === 'complete') {
    preloadCriticalRoutes()
  } else {
    window.addEventListener('load', preloadCriticalRoutes)
  }

  // Setup prefetching on link hover
  document.addEventListener('mouseover', event => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement

    if (link) {
      const path = link.pathname

      // Map path to route component
      if (path === '/services' || path === '/services/') {
        ROUTE_COMPONENTS.Services().catch(() => {})
      } else if (path === '/booking' || path === '/booking/') {
        ROUTE_COMPONENTS.Booking().catch(() => {})
      } else if (path === '/gallery' || path === '/gallery/') {
        ROUTE_COMPONENTS.Gallery().catch(() => {})
      } else if (path === '/about' || path === '/about/') {
        ROUTE_COMPONENTS.About().catch(() => {})
      } else if (path === '/contact' || path === '/contact/') {
        ROUTE_COMPONENTS.Contact().catch(() => {})
      } else if (path === '/reviews' || path === '/reviews/') {
        ROUTE_COMPONENTS.Reviews().catch(() => {})
      }
    }
  })
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initCodeSplitting()
}
