'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  storageKey: string
  defaultPosition: Position
  enabled: boolean
}

export function useDraggable({ storageKey, defaultPosition, enabled }: UseDraggableOptions) {
  const [position, setPosition] = useState<Position>(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Load saved position from localStorage on mount
  useEffect(() => {
    if (!enabled) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Position
        setPosition(parsed)
        setHasMoved(true)
      }
    } catch {
      // ignore
    }
  }, [storageKey, enabled])

  // Reset to default when disabled
  useEffect(() => {
    if (!enabled) {
      setPosition(defaultPosition)
      setHasMoved(false)
    }
  }, [enabled, defaultPosition])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    e.preventDefault()
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    }
    setIsDragging(true)
  }, [enabled, position])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return
    const touch = e.touches[0]
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: position.x,
      posY: position.y,
    }
    setIsDragging(true)
  }, [enabled, position])

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY
      const newX = dragStartRef.current.posX + dx
      const newY = dragStartRef.current.posY + dy

      // Clamp within viewport
      const el = elementRef.current
      const w = el?.offsetWidth ?? 60
      const h = el?.offsetHeight ?? 60
      const clampedX = Math.max(8, Math.min(window.innerWidth - w - 8, newX))
      const clampedY = Math.max(8, Math.min(window.innerHeight - h - 8, newY))

      setPosition({ x: clampedX, y: clampedY })
      setHasMoved(true)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - dragStartRef.current.mouseX
      const dy = touch.clientY - dragStartRef.current.mouseY
      const newX = dragStartRef.current.posX + dx
      const newY = dragStartRef.current.posY + dy

      const el = elementRef.current
      const w = el?.offsetWidth ?? 60
      const h = el?.offsetHeight ?? 60
      const clampedX = Math.max(8, Math.min(window.innerWidth - w - 8, newX))
      const clampedY = Math.max(8, Math.min(window.innerHeight - h - 8, newY))

      setPosition({ x: clampedX, y: clampedY })
      setHasMoved(true)
    }

    const onEnd = () => {
      setIsDragging(false)
      dragStartRef.current = null
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(position))
      } catch {
        // ignore
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, position, storageKey])

  const resetPosition = useCallback(() => {
    setPosition(defaultPosition)
    setHasMoved(false)
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [defaultPosition, storageKey])

  // Compute inline style: use fixed pixel position when dragged, else use null (CSS handles it)
  const style = hasMoved
    ? { position: 'fixed' as const, left: position.x, top: position.y, bottom: 'auto', right: 'auto' }
    : undefined

  return {
    elementRef,
    style,
    isDragging,
    hasMoved,
    onMouseDown,
    onTouchStart,
    resetPosition,
  }
}
