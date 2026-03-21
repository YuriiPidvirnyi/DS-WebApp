import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ADMIN_PREFERENCES_STORAGE_KEY,
  ADMIN_PREFERENCES_UPDATED_EVENT,
  DEFAULT_ADMIN_PREFERENCES,
  getStoredAdminPreferences,
  parseAdminPreferences,
  saveAdminPreferences,
} from './adminPreferences'

describe('adminPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns defaults for empty storage value', () => {
    expect(parseAdminPreferences(null)).toEqual(DEFAULT_ADMIN_PREFERENCES)
  })

  it('returns defaults for invalid JSON', () => {
    expect(parseAdminPreferences('{bad-json')).toEqual(
      DEFAULT_ADMIN_PREFERENCES
    )
  })

  it('parses partial preferences with safe defaults', () => {
    const parsed = parseAdminPreferences(
      JSON.stringify({
        compactTables: true,
        defaultAnalyticsPeriod: 90,
      })
    )

    expect(parsed.compactTables).toBe(true)
    expect(parsed.defaultAnalyticsPeriod).toBe(90)
    expect(parsed.autoRefreshLists).toBe(true)
    expect(parsed.confirmSensitiveActions).toBe(true)
  })

  it('normalizes unsupported analytics period to default', () => {
    const parsed = parseAdminPreferences(
      JSON.stringify({
        defaultAnalyticsPeriod: 365,
      })
    )

    expect(parsed.defaultAnalyticsPeriod).toBe(30)
  })

  it('saves preferences to localStorage and dispatches update event', () => {
    const eventSpy = vi.fn()
    window.addEventListener(ADMIN_PREFERENCES_UPDATED_EVENT, eventSpy)

    saveAdminPreferences({
      autoRefreshLists: false,
      compactTables: true,
      confirmSensitiveActions: false,
      defaultAnalyticsPeriod: 7,
    })

    const stored = window.localStorage.getItem(ADMIN_PREFERENCES_STORAGE_KEY)
    expect(stored).not.toBeNull()
    expect(getStoredAdminPreferences()).toEqual({
      autoRefreshLists: false,
      compactTables: true,
      confirmSensitiveActions: false,
      defaultAnalyticsPeriod: 7,
    })
    expect(eventSpy).toHaveBeenCalledTimes(1)
  })
})
