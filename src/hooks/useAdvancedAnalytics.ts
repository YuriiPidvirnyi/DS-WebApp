import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  initScrollTracking,
  initTimeTracking,
  initClickTracking,
} from '@/utils/advancedAnalytics'

/**
 * Hook to initialize advanced analytics tracking on each page
 */
export function useAdvancedAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    const pageName = pathname

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
  }, [pathname])
}

export default useAdvancedAnalytics
