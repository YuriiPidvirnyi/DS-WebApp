import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAccessibility } from '../useAccessibility'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import type { ReactNode } from 'react'

describe('useAccessibility', () => {
  it('throws error when used outside AccessibilityProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      renderHook(() => useAccessibility())
    }).toThrow('useAccessibility must be used within an AccessibilityProvider')

    console.error = originalError
  })

  it('returns accessibility context when used within provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AccessibilityProvider>{children}</AccessibilityProvider>
    )

    const { result } = renderHook(() => useAccessibility(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('fontSize')
    expect(result.current).toHaveProperty('highContrast')
    expect(result.current).toHaveProperty('reducedMotion')
    expect(result.current).toHaveProperty('increaseFontSize')
    expect(result.current).toHaveProperty('decreaseFontSize')
    expect(result.current).toHaveProperty('toggleHighContrast')
    expect(result.current).toHaveProperty('toggleReducedMotion')
  })

  it('provides boolean values for accessibility settings', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AccessibilityProvider>{children}</AccessibilityProvider>
    )

    const { result } = renderHook(() => useAccessibility(), { wrapper })

    expect(typeof result.current.highContrast).toBe('boolean')
    expect(typeof result.current.reducedMotion).toBe('boolean')
    expect(['normal', 'larger', 'largest']).toContain(result.current.fontSize)
  })

  it('provides toggle and control functions', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AccessibilityProvider>{children}</AccessibilityProvider>
    )

    const { result } = renderHook(() => useAccessibility(), { wrapper })

    expect(typeof result.current.toggleHighContrast).toBe('function')
    expect(typeof result.current.toggleReducedMotion).toBe('function')
    expect(typeof result.current.increaseFontSize).toBe('function')
    expect(typeof result.current.decreaseFontSize).toBe('function')
  })
})
