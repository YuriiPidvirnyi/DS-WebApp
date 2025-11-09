import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReminders } from '../useReminders'
import * as reminders from '@/services/reminders'

// Mock dependencies
vi.mock('@/services/reminders', () => ({
  checkDueReminders: vi.fn(() => []),
}))

vi.mock('@/utils/toast', () => ({
  showInfo: vi.fn(() => 'toast-id-123'),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    dismiss: vi.fn(),
  },
}))

vi.mock('@/utils/calendar', () => ({
  createICSEvent: vi.fn(() => 'ICS_CONTENT'),
  downloadICS: vi.fn(),
}))

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('checks reminders on mount', () => {
    renderHook(() => useReminders())

    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(1)
  })

  it('sets up interval to check reminders every 5 minutes', () => {
    renderHook(() => useReminders())

    // Initial call
    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(1)

    // Advance 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(2)

    // Advance another 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(3)
  })

  it('returns checkReminders function', () => {
    const { result } = renderHook(() => useReminders())

    expect(result.current.checkReminders).toBeDefined()
    expect(typeof result.current.checkReminders).toBe('function')
  })

  it('handles checkReminders call manually', () => {
    const { result } = renderHook(() => useReminders())

    vi.mocked(reminders.checkDueReminders).mockReturnValue([
      {
        id: 'day-test-123',
        appointmentId: 'test-123',
        type: 'day-before',
        sendAt: new Date().toISOString(),
        sent: false,
        contactMethod: 'both',
      },
    ])

    const count = result.current.checkReminders()

    expect(count).toBe(1)
    expect(reminders.checkDueReminders).toHaveBeenCalled()
  })

  it('handles errors in checkReminders gracefully', () => {
    const { result } = renderHook(() => useReminders())

    vi.mocked(reminders.checkDueReminders).mockImplementation(() => {
      throw new Error('Test error')
    })

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const count = result.current.checkReminders()

    expect(count).toBe(0)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error checking reminders:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() => useReminders())

    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(1)

    unmount()

    // Advance time - should NOT trigger more calls
    vi.advanceTimersByTime(5 * 60 * 1000)

    expect(reminders.checkDueReminders).toHaveBeenCalledTimes(1)
  })
})
