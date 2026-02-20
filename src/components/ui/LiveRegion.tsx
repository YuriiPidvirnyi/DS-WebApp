'use client'

import { useEffect, useRef } from 'react'

interface LiveRegionProps {
  message?: string
  politeness?: 'polite' | 'assertive' | 'off'
  clearOnUnmount?: boolean
}

const LiveRegion: React.FC<LiveRegionProps> = ({
  message = '',
  politeness = 'polite',
  clearOnUnmount = true,
}) => {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!regionRef.current) return

    // Clear the region first to ensure the message is announced
    regionRef.current.textContent = ''

    if (message) {
      // Small delay to ensure screen readers pick up the change
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = ''
      }
    }
  }, [clearOnUnmount])

  return (
    <div
      ref={regionRef}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )
}

export default LiveRegion

// Hook for easy use of live regions
export const useLiveRegion = () => {
  const regionRef = useRef<HTMLDivElement>(null)

  const announce = (
    message: string,
    politeness: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!regionRef.current) return

    // Update aria-live attribute if needed
    regionRef.current.setAttribute('aria-live', politeness)

    // Clear and set message
    regionRef.current.textContent = ''
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message
      }
    }, 100)
  }

  const LiveRegionComponent = () => (
    <div
      ref={regionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )

  return { announce, LiveRegionComponent }
}
