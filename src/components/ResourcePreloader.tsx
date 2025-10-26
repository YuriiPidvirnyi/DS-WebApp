import { useEffect } from 'react'

const ResourcePreloader = () => {
  useEffect(() => {
    try {
      // Only preload in production to avoid dev issues
      if (!import.meta.env.PROD) {
        return;
      }

      // Preload only existing critical images
      const criticalImages = [
        '/assets/images/logo/dental-story-logo.svg'
      ]

      const preloadResource = (src: string, as: string, type?: string) => {
        try {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.href = src
          link.as = as
          if (type) link.type = type
          if (as === 'font') link.crossOrigin = 'anonymous'
          
          // Check if resource exists before preloading
          link.onerror = () => {
            console.debug(`Preload failed for: ${src}`)
            try {
              if (link.parentNode) {
                link.parentNode.removeChild(link)
              }
            } catch (e) {
              console.debug('Failed to remove failed preload link:', e)
            }
          }
          
          document.head.appendChild(link)
        } catch (error) {
          console.debug('Failed to create preload link for:', src, error)
        }
      }

      // Preload critical images
      criticalImages.forEach(src => {
        preloadResource(src, 'image')
      })

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
        'https://fonts.gstatic.com'
      ]

      dnsPrefetch.forEach(href => {
        try {
          const link = document.createElement('link')
          link.rel = 'dns-prefetch'
          link.href = href
          document.head.appendChild(link)
        } catch (error) {
          console.debug('Failed to create DNS prefetch link for:', href, error)
        }
      })

    } catch (error) {
      console.debug('ResourcePreloader failed:', error)
    }
  }, [])

  return null
}

export default ResourcePreloader