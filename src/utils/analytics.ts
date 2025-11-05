/**
 * Google Analytics 4 Integration Utility
 */

// Event categories
export enum AnalyticsEventCategory {
  Engagement = 'engagement',
  Navigation = 'navigation',
  Forms = 'forms',
  Booking = 'booking',
  Outbound = 'outbound',
}

// Engagement events
export enum EngagementEvent {
  PageView = 'page_view',
  Scroll = 'scroll',
  ClickElement = 'click',
  TimeOnPage = 'time_on_page',
  ServiceView = 'service_view',
}

// Form events
export enum FormEvent {
  FormStart = 'form_start',
  FormStep = 'form_step',
  FormSubmit = 'form_submit',
  FormError = 'form_error',
  FormComplete = 'form_complete',
}

// Booking events
export enum BookingEvent {
  BookingStart = 'booking_start',
  ServiceSelect = 'service_select',
  DateSelect = 'date_select',
  TimeSelect = 'time_select',
  BookingComplete = 'booking_complete',
}

// Initialize Google Analytics
export const initializeAnalytics = (): void => {
  if (typeof window === 'undefined') return

  // Check if GA ID exists in environment variables
  const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
  if (!gaId) {
    console.warn('Google Analytics ID not found in environment variables')
    return
  }

  // Load the GA script dynamically (canonical GA4 snippet)
  const loadGoogleAnalytics = (): void => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    // Initialize the dataLayer array
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }

    // Initialize Google Analytics with your tracking ID
    window.gtag('js', new Date())
    window.gtag('config', gaId, {
      send_page_view: false, // We'll track page views manually with the router
    })

    if (import.meta.env.DEV) {
      console.warn('Google Analytics initialized')
    }
  }

  try {
    loadGoogleAnalytics()
  } catch (error) {
    console.error('Failed to load Google Analytics:', error)
  }
}

/**
 * Track a page view in Google Analytics
 * @param pagePath The path of the current page (e.g. /about)
 * @param pageTitle The title of the current page
 */
export const trackPageView = (pagePath: string, pageTitle: string): void => {
  if (typeof window === 'undefined' || !window.gtag) return

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

/**
 * Track a generic event in Google Analytics
 * @param eventName The name of the event to track
 * @param category The category of the event
 * @param parameters Additional parameters to send with the event
 */
export const trackEvent = (
  eventName: string,
  category: AnalyticsEventCategory,
  parameters?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined' || !window.gtag) return

  try {
    window.gtag('event', eventName, {
      event_category: category,
      ...parameters,
    })
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error)
  }
}

/**
 * Track a form submission event
 * @param formName The name of the form
 * @param isSuccess Whether the form submission was successful
 * @param data Additional data about the form submission
 */
export const trackFormSubmission = (
  formName: string,
  isSuccess: boolean,
  data?: Record<string, unknown>
): void => {
  trackEvent(
    isSuccess ? FormEvent.FormComplete : FormEvent.FormError,
    AnalyticsEventCategory.Forms,
    {
      form_name: formName,
      form_success: isSuccess,
      ...data,
    }
  )
}

/**
 * Track a booking event
 * @param eventName The name of the booking event
 * @param bookingData Data about the booking
 */
export const trackBooking = (
  eventName: BookingEvent,
  bookingData: Record<string, unknown>
): void => {
  trackEvent(eventName, AnalyticsEventCategory.Booking, bookingData)
}

/**
 * Track an outbound link click
 * @param url The URL being navigated to
 * @param linkText The text of the link that was clicked
 */
export const trackOutboundLink = (url: string, linkText: string): void => {
  trackEvent('outbound_link_click', AnalyticsEventCategory.Outbound, {
    outbound_url: url,
    link_text: linkText,
  })
}

// Type definitions for Google Analytics
type GtagArgs =
  | [command: 'js', date: Date]
  | [command: 'config', targetId: string, config?: Record<string, unknown>]
  | [command: 'event', eventName: string, parameters?: Record<string, unknown>]
  | [command: 'set', parameters: Record<string, unknown>]

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: GtagArgs) => void
  }
}
