'use client'

import { useCallback, useEffect, useRef } from 'react'

interface Options {
  open: boolean
  onClose: () => void
  /** Selector for the element to receive focus when the drawer opens. Defaults to `[data-drawer-autofocus]`. */
  autoFocusSelector?: string
}

/**
 * Shared drawer accessibility wiring: focus trap, Escape-to-close, body scroll lock,
 * focus return to the trigger after close. Used by cabinet + admin mobile drawers.
 *
 * Returns refs that the layout wires into its trigger button and drawer container.
 */
export function useDrawerA11y({
  open,
  onClose,
  autoFocusSelector = '[data-drawer-autofocus]',
}: Options) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  const close = useCallback(() => {
    onClose()
    triggerRef.current?.focus()
  }, [onClose])

  // Escape + focus trap
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  // Autofocus target element when drawer opens
  useEffect(() => {
    if (open && drawerRef.current) {
      const target =
        drawerRef.current.querySelector<HTMLElement>(autoFocusSelector)
      target?.focus()
    }
  }, [open, autoFocusSelector])

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return { triggerRef, drawerRef, close }
}
