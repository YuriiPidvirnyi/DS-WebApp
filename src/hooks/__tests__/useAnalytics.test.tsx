import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '../useAnalytics'
import * as analytics from '@/utils/analytics'

// Mock analytics utilities
vi.mock('@/utils/analytics', () => ({
  trackPageView: vi.fn(),
  trackEvent: vi.fn(),
  trackFormSubmission: vi.fn(),
  trackBooking: vi.fn(),
  trackOutboundLink: vi.fn(),
  AnalyticsEventCategory: {
    Engagement: 'engagement',
    Form: 'form',
    Booking: 'booking',
    Navigation: 'navigation',
    Outbound: 'outbound',
  },
  EngagementEvent: {
    ClickElement: 'click_element',
    ScrollDepth: 'scroll_depth',
  },
  FormEvent: {
    FormStart: 'form_start',
    FormSubmit: 'form_submit',
  },
  BookingEvent: {
    BookingStart: 'booking_start',
    BookingComplete: 'booking_complete',
  },
}))

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tracks page view on mount', () => {
    renderHook(() => useAnalytics())

    expect(analytics.trackPageView).toHaveBeenCalledWith(
      '/',
      expect.any(String)
    )
  })

  it('returns tracking functions', () => {
    const { result } = renderHook(() => useAnalytics())

    expect(result.current).toHaveProperty('trackPageView')
    expect(result.current).toHaveProperty('trackLink')
    expect(result.current).toHaveProperty('trackForm')
    expect(result.current).toHaveProperty('trackAppointment')
    expect(result.current).toHaveProperty('track')
  })

  it('trackLink calls trackOutboundLink', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackLink('https://example.com', 'Example Link')

    expect(analytics.trackOutboundLink).toHaveBeenCalledWith(
      'https://example.com',
      'Example Link'
    )
  })

  it('trackForm calls trackFormSubmission', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackForm('contact_form', true, { name: 'John' })

    expect(analytics.trackFormSubmission).toHaveBeenCalledWith(
      'contact_form',
      true,
      { name: 'John' }
    )
  })

  it('trackAppointment calls trackBooking', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackAppointment('booking_complete' as unknown as any, {
      service: 'Cleaning',
    })

    expect(analytics.trackBooking).toHaveBeenCalledWith('booking_complete', {
      service: 'Cleaning',
    })
  })

  it('track calls trackEvent with custom data', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.track('custom_event', 'engagement' as unknown as any, {
      foo: 'bar',
    })

    expect(analytics.trackEvent).toHaveBeenCalledWith(
      'custom_event',
      'engagement',
      { foo: 'bar' }
    )
  })

  it('exposes event and category constants', () => {
    const { result } = renderHook(() => useAnalytics())

    expect(result.current.events).toBeDefined()
    expect(result.current.events.EngagementEvent).toBeDefined()
    expect(result.current.events.FormEvent).toBeDefined()
    expect(result.current.events.BookingEvent).toBeDefined()
    expect(result.current.categories).toBeDefined()
  })
})
