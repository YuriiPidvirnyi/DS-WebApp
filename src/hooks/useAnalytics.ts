'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  trackPageView,
  trackEvent,
  trackFormSubmission,
  trackBooking,
  trackOutboundLink,
  AnalyticsEventCategory,
  EngagementEvent,
  FormEvent,
  BookingEvent,
} from '@/utils/analytics'

/**
 * Hook for tracking page views automatically and exposing other analytics functions
 */
export const useAnalytics = () => {
  const pathname = usePathname()

  // Track page views — deferred to avoid blocking main thread during hydration
  useEffect(() => {
    const run = () => {
      const pageTitle = document.title || 'Dental Story'
      trackPageView(pathname, pageTitle)
    }
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(run)
      return () => cancelIdleCallback(id)
    } else {
      const id = setTimeout(run, 2000)
      return () => clearTimeout(id)
    }
  }, [pathname])

  // Utility function to track element clicks with proper event delegation
  const trackElementClicks = useCallback(() => {
    // Create a map of data-track-* attributes to corresponding event properties
    const handleClick = (event: MouseEvent) => {
      let target = event.target as HTMLElement

      // Traverse up the DOM tree to find closest trackable element
      while (target && target !== document.body) {
        if (target.hasAttribute('data-track-id')) {
          const trackId = target.getAttribute('data-track-id')
          const trackCategory =
            target.getAttribute('data-track-category') ||
            AnalyticsEventCategory.Engagement
          const trackLabel = target.getAttribute('data-track-label') || ''
          const trackValue = target.getAttribute('data-track-value') || ''

          // Collect additional tracking attributes
          const trackData: Record<string, unknown> = {}
          Array.from(target.attributes)
            .filter(attr => attr.name.startsWith('data-track-prop-'))
            .forEach(attr => {
              const propName = attr.name.replace('data-track-prop-', '')
              trackData[propName] = attr.value
            })

          // Add common properties
          trackData.label = trackLabel
          if (trackValue) {
            trackData.value = trackValue
          }

          // Track the event
          trackEvent(
            trackId || EngagementEvent.ClickElement,
            trackCategory as AnalyticsEventCategory,
            trackData
          )
          break
        }

        // Move up to parent element
        target = target.parentElement as HTMLElement
      }
    }

    // Add event listener
    document.body.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      document.body.removeEventListener('click', handleClick)
    }
  }, [])

  // Initialize click tracking — deferred to reduce TBT
  useEffect(() => {
    let cleanup: (() => void) | undefined
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => {
        cleanup = trackElementClicks()
      })
      return () => {
        cancelIdleCallback(id)
        cleanup?.()
      }
    } else {
      const id = setTimeout(() => {
        cleanup = trackElementClicks()
      }, 2000)
      return () => {
        clearTimeout(id)
        cleanup?.()
      }
    }
  }, [trackElementClicks])

  // Outbound link tracking
  const trackLink = useCallback((url: string, linkText: string) => {
    trackOutboundLink(url, linkText)
  }, [])

  // Form tracking utilities
  const trackForm = useCallback(
    (formName: string, isSuccess: boolean, data?: Record<string, unknown>) => {
      trackFormSubmission(formName, isSuccess, data)
    },
    []
  )

  // Appointment booking tracking
  const trackAppointment = useCallback(
    (eventName: BookingEvent, data: Record<string, unknown>) => {
      trackBooking(eventName, data)
    },
    []
  )

  // Custom event tracking
  const track = useCallback(
    (
      eventName: string,
      category: AnalyticsEventCategory = AnalyticsEventCategory.Engagement,
      data?: Record<string, unknown>
    ) => {
      trackEvent(eventName, category, data)
    },
    []
  )

  return {
    trackPageView,
    trackLink,
    trackForm,
    trackAppointment,
    track,
    events: {
      EngagementEvent,
      FormEvent,
      BookingEvent,
    },
    categories: AnalyticsEventCategory,
  }
}

export default useAnalytics
