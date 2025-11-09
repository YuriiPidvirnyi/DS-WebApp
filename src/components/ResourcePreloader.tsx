import { useEffect } from 'react'

const ResourcePreloader = () => {
  useEffect(() => {
    try {
      // Only preload in production to avoid dev issues
      if (!import.meta.env.PROD) {
        return
      }

      // Note: Logo removed from preload as it's not used immediately on page load
      // It loads fast enough without preloading

      // Preload next likely page
      const prefetchPages = ['/services', '/booking', '/contact']

      prefetchPages.forEach(href => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = href
        document.head.appendChild(link)
      })

      // DNS prefetch for external resources
      const dnsPrefetch = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ]

      dnsPrefetch.forEach(href => {
        try {
          const link = document.createElement('link')
          link.rel = 'dns-prefetch'
          link.href = href
          document.head.appendChild(link)
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Failed to create DNS prefetch link for:', href, error)
          }
        }
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('ResourcePreloader failed:', error)
      }
    }
  }, [])

  return null
}

export default ResourcePreloader
