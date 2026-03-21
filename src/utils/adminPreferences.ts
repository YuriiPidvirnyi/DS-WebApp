export interface AdminPreferences {
  autoRefreshLists: boolean
  compactTables: boolean
  confirmSensitiveActions: boolean
  defaultAnalyticsPeriod: 7 | 30 | 90
}

export const ADMIN_PREFERENCES_STORAGE_KEY = 'admin_settings_v1'
export const ADMIN_PREFERENCES_UPDATED_EVENT = 'admin-preferences-updated'

export const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  autoRefreshLists: true,
  compactTables: false,
  confirmSensitiveActions: true,
  defaultAnalyticsPeriod: 30,
}

export function parseAdminPreferences(value: string | null): AdminPreferences {
  if (!value) return DEFAULT_ADMIN_PREFERENCES

  try {
    const parsed = JSON.parse(value) as Partial<AdminPreferences>
    const period = parsed.defaultAnalyticsPeriod
    const safePeriod =
      period === 7 || period === 30 || period === 90 ? period : 30

    return {
      autoRefreshLists:
        parsed.autoRefreshLists ?? DEFAULT_ADMIN_PREFERENCES.autoRefreshLists,
      compactTables:
        parsed.compactTables ?? DEFAULT_ADMIN_PREFERENCES.compactTables,
      confirmSensitiveActions:
        parsed.confirmSensitiveActions ??
        DEFAULT_ADMIN_PREFERENCES.confirmSensitiveActions,
      defaultAnalyticsPeriod: safePeriod,
    }
  } catch {
    return DEFAULT_ADMIN_PREFERENCES
  }
}

export function getStoredAdminPreferences(): AdminPreferences {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PREFERENCES

  return parseAdminPreferences(
    window.localStorage.getItem(ADMIN_PREFERENCES_STORAGE_KEY)
  )
}

export function saveAdminPreferences(preferences: AdminPreferences): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    ADMIN_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  )
  window.dispatchEvent(new Event(ADMIN_PREFERENCES_UPDATED_EVENT))
}
