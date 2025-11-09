import { trackEvent, AnalyticsEventCategory } from './analytics'

/**
 * Advanced analytics events for detailed user behavior tracking
 */

// Event types
export enum AdvancedEvent {
  // Form interactions
  FormFieldFocus = 'form_field_focus',
  FormFieldBlur = 'form_field_blur',
  FormFieldError = 'form_field_error',
  FormFieldCorrected = 'form_field_corrected',
  FormStepComplete = 'form_step_complete',
  FormAbandoned = 'form_abandoned',

  // Scroll tracking
  ScrollDepth25 = 'scroll_depth_25',
  ScrollDepth50 = 'scroll_depth_50',
  ScrollDepth75 = 'scroll_depth_75',
  ScrollDepth100 = 'scroll_depth_100',

  // Time on page
  TimeOnPage30s = 'time_on_page_30s',
  TimeOnPage60s = 'time_on_page_60s',
  TimeOnPage120s = 'time_on_page_120s',
  TimeOnPage300s = 'time_on_page_300s',

  // Click heatmap
  ElementClick = 'element_click',
  LinkClick = 'link_click',
  ButtonClick = 'button_click',
  ImageClick = 'image_click',

  // User journey funnel
  FunnelStart = 'funnel_start',
  FunnelStep = 'funnel_step',
  FunnelComplete = 'funnel_complete',
  FunnelDrop = 'funnel_drop',

  // Conversion tracking
  ConversionBooking = 'conversion_booking',
  ConversionContact = 'conversion_contact',
  ConversionNewsletter = 'conversion_newsletter',
  ConversionPhoneClick = 'conversion_phone_click',

  // A/B testing
  VariantAssigned = 'variant_assigned',
  VariantImpression = 'variant_impression',
  VariantConversion = 'variant_conversion',
}

/**
 * Track form field interactions
 */
export function trackFormFieldInteraction(
  formName: string,
  fieldName: string,
  event: 'focus' | 'blur' | 'error' | 'corrected',
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    focus: AdvancedEvent.FormFieldFocus,
    blur: AdvancedEvent.FormFieldBlur,
    error: AdvancedEvent.FormFieldError,
    corrected: AdvancedEvent.FormFieldCorrected,
  }

  trackEvent(eventMap[event], AnalyticsEventCategory.Forms, {
    form_name: formName,
    field_name: fieldName,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Track scroll depth milestones
 */
export function trackScrollDepth(depth: 25 | 50 | 75 | 100, page: string) {
  const eventMap = {
    25: AdvancedEvent.ScrollDepth25,
    50: AdvancedEvent.ScrollDepth50,
    75: AdvancedEvent.ScrollDepth75,
    100: AdvancedEvent.ScrollDepth100,
  }

  trackEvent(eventMap[depth], AnalyticsEventCategory.Engagement, {
    page,
    depth_percentage: depth,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track time spent on page
 */
export function trackTimeOnPage(duration: 30 | 60 | 120 | 300, page: string) {
  const eventMap = {
    30: AdvancedEvent.TimeOnPage30s,
    60: AdvancedEvent.TimeOnPage60s,
    120: AdvancedEvent.TimeOnPage120s,
    300: AdvancedEvent.TimeOnPage300s,
  }

  trackEvent(eventMap[duration], AnalyticsEventCategory.Engagement, {
    page,
    duration_seconds: duration,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track element clicks for heatmap generation
 */
export function trackElementClick(
  elementType: 'link' | 'button' | 'image' | 'other',
  elementId?: string,
  elementText?: string,
  position?: { x: number; y: number }
) {
  const eventMap = {
    link: AdvancedEvent.LinkClick,
    button: AdvancedEvent.ButtonClick,
    image: AdvancedEvent.ImageClick,
    other: AdvancedEvent.ElementClick,
  }

  trackEvent(eventMap[elementType], AnalyticsEventCategory.Engagement, {
    element_type: elementType,
    element_id: elementId,
    element_text: elementText,
    click_position_x: position?.x,
    click_position_y: position?.y,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track user journey funnel
 */
export function trackFunnelEvent(
  funnelName: string,
  step: 'start' | 'step' | 'complete' | 'drop',
  stepNumber?: number,
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    start: AdvancedEvent.FunnelStart,
    step: AdvancedEvent.FunnelStep,
    complete: AdvancedEvent.FunnelComplete,
    drop: AdvancedEvent.FunnelDrop,
  }

  trackEvent(eventMap[step], AnalyticsEventCategory.Engagement, {
    funnel_name: funnelName,
    step_number: stepNumber,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Track conversion events
 */
export function trackConversion(
  type: 'booking' | 'contact' | 'newsletter' | 'phone_click',
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    booking: AdvancedEvent.ConversionBooking,
    contact: AdvancedEvent.ConversionContact,
    newsletter: AdvancedEvent.ConversionNewsletter,
    phone_click: AdvancedEvent.ConversionPhoneClick,
  }

  trackEvent(eventMap[type], AnalyticsEventCategory.Engagement, {
    conversion_type: type,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Track A/B test variant assignment and conversion
 */
export function trackABTest(
  testName: string,
  variant: string,
  event: 'assigned' | 'impression' | 'conversion',
  metadata?: Record<string, unknown>
) {
  const eventMap = {
    assigned: AdvancedEvent.VariantAssigned,
    impression: AdvancedEvent.VariantImpression,
    conversion: AdvancedEvent.VariantConversion,
  }

  trackEvent(eventMap[event], AnalyticsEventCategory.Engagement, {
    test_name: testName,
    variant,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Initialize scroll depth tracking
 */
export function initScrollTracking(page: string) {
  const milestones = new Set<number>()
  let maxScroll = 0

  const handleScroll = () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight
    const scrollTop = window.scrollY
    const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100)

    // Track new milestone
    if (scrollPercentage > maxScroll) {
      maxScroll = scrollPercentage

      // Check milestones
      ;[25, 50, 75, 100].forEach(milestone => {
        if (scrollPercentage >= milestone && !milestones.has(milestone)) {
          milestones.add(milestone)
          trackScrollDepth(milestone as 25 | 50 | 75 | 100, page)
        }
      })
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}

/**
 * Initialize time on page tracking
 */
export function initTimeTracking(page: string) {
  const startTime = Date.now()
  const milestones = new Set<number>()

  const intervals = [30, 60, 120, 300] // seconds

  intervals.forEach(duration => {
    setTimeout(() => {
      if (!milestones.has(duration)) {
        milestones.add(duration)
        trackTimeOnPage(duration as 30 | 60 | 120 | 300, page)
      }
    }, duration * 1000)
  })

  // Cleanup on page unload
  const cleanup = () => {
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    trackEvent('page_time_total', AnalyticsEventCategory.Engagement, {
      page,
      total_seconds: totalTime,
    })
  }

  window.addEventListener('beforeunload', cleanup)

  return () => {
    window.removeEventListener('beforeunload', cleanup)
  }
}

/**
 * Initialize click heatmap tracking
 */
export function initClickTracking() {
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (!target) return

    // Determine element type
    let elementType: 'link' | 'button' | 'image' | 'other' = 'other'
    if (target.tagName === 'A') elementType = 'link'
    else if (target.tagName === 'BUTTON') elementType = 'button'
    else if (target.tagName === 'IMG') elementType = 'image'

    // Get element info
    const elementId = target.id
    const elementText = target.textContent?.trim().substring(0, 50) || ''
    const position = {
      x: event.clientX,
      y: event.clientY,
    }

    trackElementClick(elementType, elementId, elementText, position)
  }

  document.addEventListener('click', handleClick, { passive: true })

  return () => {
    document.removeEventListener('click', handleClick)
  }
}
