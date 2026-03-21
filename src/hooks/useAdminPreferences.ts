'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ADMIN_PREFERENCES_STORAGE_KEY,
  ADMIN_PREFERENCES_UPDATED_EVENT,
  DEFAULT_ADMIN_PREFERENCES,
  getStoredAdminPreferences,
  parseAdminPreferences,
  saveAdminPreferences,
  type AdminPreferences,
} from '@/utils/adminPreferences'

export function useAdminPreferences() {
  const [preferences, setPreferences] = useState<AdminPreferences>(
    DEFAULT_ADMIN_PREFERENCES
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    setPreferences(getStoredAdminPreferences())

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_PREFERENCES_STORAGE_KEY) return
      setPreferences(parseAdminPreferences(event.newValue))
    }

    const handlePreferencesUpdate = () => {
      setPreferences(getStoredAdminPreferences())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(
      ADMIN_PREFERENCES_UPDATED_EVENT,
      handlePreferencesUpdate
    )

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(
        ADMIN_PREFERENCES_UPDATED_EVENT,
        handlePreferencesUpdate
      )
    }
  }, [])

  const updatePreferences = useCallback((patch: Partial<AdminPreferences>) => {
    setPreferences(previous => {
      const next = { ...previous, ...patch }
      saveAdminPreferences(next)
      return next
    })
  }, [])

  return { preferences, updatePreferences }
}
