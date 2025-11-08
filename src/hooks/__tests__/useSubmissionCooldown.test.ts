import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSubmissionCooldown } from '../useSubmissionCooldown'

describe('useSubmissionCooldown', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('initializes without cooldown', () => {
    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    expect(result.current.isCoolingDown).toBe(false)
    expect(result.current.remainingSec).toBe(0)
  })

  it('provides start function', () => {
    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.clear).toBe('function')
  })

  it('stores cooldown in localStorage', () => {
    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    act(() => {
      result.current.start()
    })

    const stored = localStorage.getItem('submission_cooldowns')
    expect(stored).not.toBeNull()
  })

  it('clears cooldown from localStorage', () => {
    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.clear()
    })

    const stored = localStorage.getItem('submission_cooldowns')
    const parsed = stored ? JSON.parse(stored) : {}
    expect(parsed['test_form']).toBeUndefined()
  })

  it('maintains separate cooldowns for different keys', () => {
    const { result: result1 } = renderHook(() =>
      useSubmissionCooldown('form_a', 30)
    )

    // Create second hook to ensure keys are separate
    renderHook(() => useSubmissionCooldown('form_b', 30))

    act(() => {
      result1.current.start(30)
    })

    const stored = localStorage.getItem('submission_cooldowns')
    const parsed = stored ? JSON.parse(stored) : {}
    expect(parsed['form_a']).toBeDefined()
    expect(parsed['form_b']).toBeUndefined()
  })

  it('handles corrupted localStorage data', () => {
    localStorage.setItem('submission_cooldowns', 'invalid-json')

    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    // Should initialize without errors
    expect(result.current.isCoolingDown).toBe(false)

    // Should be able to start cooldown without crashing
    expect(() => {
      act(() => {
        result.current.start()
      })
    }).not.toThrow()
  })

  it('handles setItem errors gracefully', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

    const { result } = renderHook(() => useSubmissionCooldown('test_form', 30))

    // Should not throw
    expect(() => {
      act(() => {
        result.current.start()
      })
    }).not.toThrow()

    setItemSpy.mockRestore()
  })
})
