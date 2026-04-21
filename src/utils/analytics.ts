/**
 * Analytics utility — dual-emits to GA4 (consent-gated) and Vercel Analytics.
 */

import { track as vaTrack } from '@vercel/analytics'
import { hasConsent } from '@/utils/cookieConsent'

// Event categories
export enum AnalyticsEventCategory {
  Engagement = 'engagement',
  Navigation = 'navigation',
  Forms = 'forms',
  Booking = 'booking',
  Outbound = 'outbound',
  Chat = 'chat',
  Cabinet = 'cabinet',
  AI = 'ai',
}

// Engagement events
export enum EngagementEvent {
  PageView = 'page_view',
  Scroll = 'scroll',
  ClickElement = 'click',
  TimeOnPage = 'time_on_page',
  ServiceView = 'service_view',
  LanguageChanged = 'language_changed',
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

// Live chat events
export enum ChatEvent {
  ChatSessionStarted = 'chat_session_started',
  ChatMessageSent = 'chat_message_sent',
}

// Symptom checker / AI events
export enum AIEvent {
  SymptomCheckerStarted = 'symptom_checker_started',
  AIMessageSent = 'ai_message_sent',
}

// Cabinet events
export enum CabinetEvent {
  TreatmentViewed = 'treatment_viewed',
  ProfileUpdated = 'cabinet_profile_updated',
}

// Initialize Google Analytics
export const initializeAnalytics = (): void => {
  if (typeof window === 'undefined') return
  if (!hasConsent()) return

  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  if (!gaId) return

  const loadGoogleAnalytics = (): void => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }

    window.gtag('js', new Date())
    window.gtag('config', gaId, {
      send_page_view: false,
    })
  }

  try {
    loadGoogleAnalytics()
  } catch (error) {
    console.error('Failed to load Google Analytics:', error)
  }
}

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
 * Track a generic event — emits to GA4 (when consented) and Vercel Analytics.
 */
export const trackEvent = (
  eventName: string,
  category: AnalyticsEventCategory,
  parameters?: Record<string, unknown>
): void => {
  // Vercel Analytics — always fires (no PII, no consent required)
  try {
    vaTrack(eventName, { category, ...parameters })
  } catch {
    // VA may be unavailable in non-browser environments
  }

  // GA4 — consent-gated
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

export const trackBooking = (
  eventName: BookingEvent,
  bookingData: Record<string, unknown>
): void => {
  trackEvent(eventName, AnalyticsEventCategory.Booking, bookingData)
}

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
  | [
      command: 'consent',
      action: 'default' | 'update',
      parameters: Record<string, string>,
    ]

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: GtagArgs) => void
  }
}
