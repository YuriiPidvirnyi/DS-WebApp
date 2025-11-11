import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  initScrollTracking,
  initTimeTracking,
  initClickTracking,
} from '@/utils/advancedAnalytics'

/**
 * Hook to initialize advanced analytics tracking on each page
 */
export function useAdvancedAnalytics() {
  const location = useLocation()

  useEffect(() => {
    const pageName = location.pathname

    // Initialize scroll depth tracking
    const cleanupScroll = initScrollTracking(pageName)

    // Initialize time on page tracking
    const cleanupTime = initTimeTracking(pageName)

    // Initialize click heatmap tracking
    const cleanupClick = initClickTracking()

    // Cleanup on unmount or route change
    return () => {
      cleanupScroll()
      cleanupTime()
      cleanupClick()
    }
  }, [location.pathname])
}

export default useAdvancedAnalytics
