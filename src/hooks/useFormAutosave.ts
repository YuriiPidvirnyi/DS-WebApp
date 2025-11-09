import { useEffect, useRef } from 'react'
import { UseFormWatch } from 'react-hook-form'

interface UseFormAutosaveOptions {
  key: string
  watch: UseFormWatch<any>
  debounceMs?: number
  enabled?: boolean
  onSave?: (data: any) => void
}

/**
 * Hook to automatically save form data to localStorage
 * Useful for preventing data loss on accidental page navigation
 */
export function useFormAutosave({
  key,
  watch,
  debounceMs = 1000,
  enabled = true,
  onSave,
}: UseFormAutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const storageKey = `form-autosave-${key}`

  useEffect(() => {
    if (!enabled) return

    const subscription = watch(data => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for debounced save
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(data))
          onSave?.(data)
        } catch (error) {
          console.error('Failed to autosave form:', error)
        }
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [watch, storageKey, debounceMs, enabled, onSave])

  const restore = (): any | null => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to restore form data:', error)
      return null
    }
  }

  const clear = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear autosave data:', error)
    }
  }

  return {
    restore,
    clear,
  }
}
