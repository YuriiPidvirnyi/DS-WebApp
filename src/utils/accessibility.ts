/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  const focusableElements = Array.from(
    element.querySelectorAll<HTMLElement>(focusableSelectors)
  )

  if (focusableElements.length === 0) return () => {}

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)
  firstElement.focus()

  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Check if element is visible for screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  return (
    element.offsetParent !== null &&
    !element.hasAttribute('aria-hidden') &&
    element.getAttribute('aria-hidden') !== 'true'
  )
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)?.map(c => parseInt(c) / 255) || [0, 0, 0]

    const [r, g, b] = rgb.map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const requiredRatio = isLargeText ? 3 : 4.5
  return ratio >= requiredRatio
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const requiredRatio = isLargeText ? 4.5 : 7
  return ratio >= requiredRatio
}

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0
export function generateAriaId(prefix = 'aria'): string {
  idCounter++
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Manage focus restoration
 */
class FocusManager {
  private previousFocus: HTMLElement | null = null

  save(): void {
    this.previousFocus = document.activeElement as HTMLElement
  }

  restore(): void {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus()
      this.previousFocus = null
    }
  }
}

export const focusManager = new FocusManager()

/**
 * Skip link handler for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  text: string
): HTMLAnchorElement {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.className = 'skip-link'
  skipLink.textContent = text
  skipLink.addEventListener('click', e => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return skipLink
}

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigator {
  private elements: HTMLElement[]
  private currentIndex = -1

  constructor(
    container: HTMLElement,
    selector = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) {
    this.elements = Array.from(
      container.querySelectorAll<HTMLElement>(selector)
    )
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.elements.length
    this.elements[this.currentIndex]?.focus()
  }

  previous(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.elements.length) % this.elements.length
    this.elements[this.currentIndex]?.focus()
  }

  first(): void {
    this.currentIndex = 0
    this.elements[0]?.focus()
  }

  last(): void {
    this.currentIndex = this.elements.length - 1
    this.elements[this.currentIndex]?.focus()
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        this.next()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        this.previous()
        break
      case 'Home':
        event.preventDefault()
        this.first()
        break
      case 'End':
        event.preventDefault()
        this.last()
        break
    }
  }
}

/**
 * ARIA live region manager
 */
class LiveRegionManager {
  private regions = new Map<string, HTMLElement>()

  createRegion(
    id: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): HTMLElement {
    if (this.regions.has(id)) {
      return this.regions.get(id)!
    }

    const region = document.createElement('div')
    region.id = id
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', priority)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'

    document.body.appendChild(region)
    this.regions.set(id, region)

    return region
  }

  announce(id: string, message: string): void {
    const region = this.regions.get(id)
    if (region) {
      region.textContent = message
    }
  }

  destroy(id: string): void {
    const region = this.regions.get(id)
    if (region) {
      document.body.removeChild(region)
      this.regions.delete(id)
    }
  }

  destroyAll(): void {
    this.regions.forEach(region => {
      document.body.removeChild(region)
    })
    this.regions.clear()
  }
}

export const liveRegionManager = new LiveRegionManager()

/**
 * Reduced motion detection
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * High contrast detection
 */
export function prefersHighContrast(): boolean {
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  )
}

/**
 * Color scheme detection
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Initialize accessibility features
 */
export function initAccessibility(): void {
  // Add skip link
  const skipLink = createSkipLink('main-content', 'Перейти до основного вмісту')
  document.body.insertBefore(skipLink, document.body.firstChild)

  // Create default live region
  liveRegionManager.createRegion('main-announcements', 'polite')

  // Log accessibility preferences
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log('Accessibility preferences:', {
      reducedMotion: prefersReducedMotion(),
      highContrast: prefersHighContrast(),
      darkMode: prefersDarkMode(),
    })
  }
}

/**
 * React hook for accessibility features
 */
import { useEffect, useState } from 'react'

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(prefersReducedMotion())

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReduced(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}

export function useHighContrast(): boolean {
  const [prefersHigh, setPrefersHigh] = useState(prefersHighContrast())

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = () => setPrefersHigh(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHigh
}

export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  active: boolean
): void {
  useEffect(() => {
    if (!active || !ref.current) return

    const cleanup = trapFocus(ref.current)
    return cleanup
  }, [ref, active])
}

/**
 * Accessible form validation messages
 */
export function createValidationMessage(
  inputId: string,
  message: string,
  type: 'error' | 'warning' | 'success' = 'error'
): HTMLElement {
  const messageId = `${inputId}-${type}`
  const messageElement = document.createElement('span')
  messageElement.id = messageId
  messageElement.className = `validation-message validation-${type}`
  messageElement.setAttribute('role', type === 'error' ? 'alert' : 'status')
  messageElement.textContent = message

  return messageElement
}

/**
 * ARIA label helpers
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label)
}

export function setAriaDescribedBy(element: HTMLElement, ids: string[]): void {
  element.setAttribute('aria-describedby', ids.join(' '))
}

export function setAriaLabelledBy(element: HTMLElement, ids: string[]): void {
  element.setAttribute('aria-labelledby', ids.join(' '))
}

/**
 * Tooltip accessibility helper
 */
export function makeTooltipAccessible(
  trigger: HTMLElement,
  tooltip: HTMLElement
): () => void {
  const tooltipId = generateAriaId('tooltip')
  tooltip.id = tooltipId
  tooltip.setAttribute('role', 'tooltip')

  trigger.setAttribute('aria-describedby', tooltipId)

  const showTooltip = () => {
    tooltip.style.display = 'block'
  }

  const hideTooltip = () => {
    tooltip.style.display = 'none'
  }

  trigger.addEventListener('mouseenter', showTooltip)
  trigger.addEventListener('mouseleave', hideTooltip)
  trigger.addEventListener('focus', showTooltip)
  trigger.addEventListener('blur', hideTooltip)

  return () => {
    trigger.removeEventListener('mouseenter', showTooltip)
    trigger.removeEventListener('mouseleave', hideTooltip)
    trigger.removeEventListener('focus', showTooltip)
    trigger.removeEventListener('blur', hideTooltip)
  }
}
