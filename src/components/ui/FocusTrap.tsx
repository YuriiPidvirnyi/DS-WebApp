import React, { useRef, useEffect } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  restoreFocus?: boolean
  className?: string
}

const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement
    }

    // Focus the container or the first focusable element inside it
    const focusContainer = () => {
      if (!containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus()
      } else {
        containerRef.current.focus()
      }
    }

    // Trap focus within the container
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active || !containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab: if focused on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: if focused on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      // Escape key support
      if (e.key === 'Escape') {
        // Custom event that parent components can listen to
        const escapeEvent = new CustomEvent('focustrap:escape', { bubbles: true })
        containerRef.current.dispatchEvent(escapeEvent)
      }
    }

    // Set up focus trap
    focusContainer()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus()
      }
    }
  }, [active, restoreFocus])

  if (!active) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={-1}
      role="region"
      aria-label="Focus trapped content"
    >
      {children}
    </div>
  )
}

export default FocusTrap