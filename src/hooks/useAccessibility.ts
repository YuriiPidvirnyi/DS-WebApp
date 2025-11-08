import { useContext } from 'react'
import { AccessibilityContext } from '@/components/AccessibilityProvider'

/**
 * Custom hook to use accessibility context
 * Must be used within AccessibilityProvider
 */
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)

  if (context === undefined) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    )
  }

  return context
}
