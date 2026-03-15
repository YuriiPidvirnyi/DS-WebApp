'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  storageKey: string
  enabled: boolean
}

export function useDraggable({ storageKey, enabled }: UseDraggableOptions) {
  // null = not moved yet, use CSS className for positioning
  const [position, setPosition] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  // Store latest position in a ref so onEnd closure always sees fresh value
  const positionRef = useRef<Position | null>(null)

  // Sync ref with state
  useEffect(() => {
    positionRef.current = position
  }, [position])

  // Load saved position from localStorage on mount (independent of enabled state)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Position
        setPosition(parsed)
        positionRef.current = parsed
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (!enabled || !elementRef.current) return

    // Get the element's CURRENT position in the viewport
    const rect = elementRef.current.getBoundingClientRect()

    // Store drag start: mouse coords + element's top-left in viewport
    const startData = {
      mouseX: clientX,
      mouseY: clientY,
      elX: rect.left,
      elY: rect.top,
    }

    setIsDragging(true)
    // Immediately fix the element at its current visual position
    const initial = { x: rect.left, y: rect.top }
    setPosition(initial)
    positionRef.current = initial

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startData.mouseX
      const dy = e.clientY - startData.mouseY
      const el = elementRef.current
      const w = el?.offsetWidth ?? 60
      const h = el?.offsetHeight ?? 60
      const newX = Math.max(8, Math.min(window.innerWidth - w - 8, startData.elX + dx))
      const newY = Math.max(8, Math.min(window.innerHeight - h - 8, startData.elY + dy))
      const next = { x: newX, y: newY }
      setPosition(next)
      positionRef.current = next
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const dx = touch.clientX - startData.mouseX
      const dy = touch.clientY - startData.mouseY
      const el = elementRef.current
      const w = el?.offsetWidth ?? 60
      const h = el?.offsetHeight ?? 60
      const newX = Math.max(8, Math.min(window.innerWidth - w - 8, startData.elX + dx))
      const newY = Math.max(8, Math.min(window.innerHeight - h - 8, startData.elY + dy))
      const next = { x: newX, y: newY }
      setPosition(next)
      positionRef.current = next
    }

    const onEnd = () => {
      setIsDragging(false)
      // Save latest position using ref (not stale closure)
      try {
        if (positionRef.current) {
          localStorage.setItem(storageKey, JSON.stringify(positionRef.current))
        }
      } catch {
        // ignore
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  }, [enabled, storageKey])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }, [enabled, startDrag])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    startDrag(touch.clientX, touch.clientY)
  }, [enabled, startDrag])

  const resetPosition = useCallback(() => {
    setPosition(null)
    positionRef.current = null
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey])

  // Style: fixed pixel position when moved, undefined otherwise (CSS className takes over)
  const style: React.CSSProperties | undefined = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto',
      }
    : undefined

  return {
    elementRef,
    style,
    isDragging,
    hasMoved: position !== null,
    onMouseDown,
    onTouchStart,
    resetPosition,
  }
}
