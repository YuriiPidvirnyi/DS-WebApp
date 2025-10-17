/**
 * Image optimization utilities for responsive images and WebP support
 */

// Image sizes for different breakpoints
export const IMAGE_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  large: 1920,
} as const

// Common aspect ratios for different image types
export const ASPECT_RATIOS = {
  square: '1/1',
  video: '16/9',
  portrait: '3/4',
  landscape: '4/3',
  hero: '21/9',
  service: '4/3',
  team: '3/4',
  gallery: '3/2',
} as const

// Image quality settings
export const QUALITY_SETTINGS = {
  low: 40,
  medium: 65,
  high: 80,
  lossless: 100,
} as const

/**
 * Generate srcSet string for responsive images
 * @param basePath Base path of the image
 * @param sizes Array of image sizes
 * @param format Image format (jpg, webp, etc.)
 * @returns srcSet string
 */
export const generateSrcSet = (
  basePath: string,
  sizes: number[] = [IMAGE_BREAKPOINTS.mobile, IMAGE_BREAKPOINTS.tablet, IMAGE_BREAKPOINTS.desktop],
  format: string = 'jpg'
): string => {
  return sizes
    .map(size => {
      const extension = format === 'jpg' ? 'jpg' : format
      return `${basePath}-${size}w.${extension} ${size}w`
    })
    .join(', ')
}

/**
 * Generate sizes string for responsive images
 * @param breakpoints Object with breakpoint: size pairs
 * @returns sizes string
 */
export const generateSizes = (breakpoints: Record<string, string>): string => {
  const entries = Object.entries(breakpoints)
  const sizeQueries = entries.slice(0, -1).map(([bp, size]) => {
    const minWidth = IMAGE_BREAKPOINTS[bp as keyof typeof IMAGE_BREAKPOINTS]
    return `(min-width: ${minWidth}px) ${size}`
  })
  
  // Add default size (last entry)
  const defaultSize = entries[entries.length - 1][1]
  sizeQueries.push(defaultSize)
  
  return sizeQueries.join(', ')
}

/**
 * Create optimized image configuration for common use cases
 */
export const createImageConfig = (
  imagePath: string,
  type: keyof typeof ASPECT_RATIOS,
  options: {
    quality?: keyof typeof QUALITY_SETTINGS
    sizes?: Partial<Record<keyof typeof IMAGE_BREAKPOINTS, string>>
    priority?: boolean
    webpSupported?: boolean
  } = {}
) => {
  const {
    sizes = {},
    priority = false,
    webpSupported = true,
  } = options

  // Default sizes for different image types
  const defaultSizes = {
    hero: {
      mobile: '100vw',
      tablet: '100vw',
      desktop: '100vw',
    },
    service: {
      mobile: '100vw',
      tablet: '50vw',
      desktop: '33vw',
    },
    team: {
      mobile: '100vw',
      tablet: '50vw',
      desktop: '25vw',
    },
    gallery: {
      mobile: '100vw',
      tablet: '50vw',
      desktop: '33vw',
    },
  }

  const finalSizes = {
    ...defaultSizes[type as keyof typeof defaultSizes],
    ...sizes,
  }

  // Common image sizes based on type
  const imageSizes = type === 'hero' 
    ? [IMAGE_BREAKPOINTS.mobile, IMAGE_BREAKPOINTS.tablet, IMAGE_BREAKPOINTS.desktop, IMAGE_BREAKPOINTS.large]
    : [IMAGE_BREAKPOINTS.mobile, IMAGE_BREAKPOINTS.tablet, IMAGE_BREAKPOINTS.desktop]

  const basePath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '')
  
  const config = {
    src: `${basePath}.jpg`,
    srcSet: generateSrcSet(basePath, imageSizes, 'jpg'),
    sizes: generateSizes(finalSizes),
    aspectRatio: ASPECT_RATIOS[type],
    priority,
    ...(webpSupported && {
      webpSrc: `${basePath}.webp`,
      webpSrcSet: generateSrcSet(basePath, imageSizes, 'webp'),
    })
  }

  return config
}

/**
 * Preload critical images for better performance
 * @param imageConfigs Array of image configurations
 */
export const preloadCriticalImages = (imageConfigs: Array<{
  src: string
  webpSrc?: string
  priority: boolean
}>): void => {
  imageConfigs
    .filter(config => config.priority)
    .forEach(config => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      
      // Prefer WebP if available
      link.href = config.webpSrc || config.src
      
      document.head.appendChild(link)
    })
}

/**
 * Check if WebP is supported by the browser
 * @returns Promise<boolean>
 */
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Lazy load images using Intersection Observer
 * @param selector CSS selector for images to lazy load
 * @param rootMargin Margin around the root
 */
export const enableLazyLoading = (
  selector: string = '[data-lazy]',
  rootMargin: string = '50px'
): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            const srcSet = img.dataset.srcset
            
            if (src) img.src = src
            if (srcSet) img.srcset = srcSet
            
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        })
      },
      { rootMargin }
    )

    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img)
    })
  }
}

/**
 * Image optimization constants for different contexts
 */
export const IMAGE_CONFIGS = {
  hero: createImageConfig('/assets/images/hero/hero-placeholder', 'hero', { 
    priority: true,
    sizes: { mobile: '100vw', tablet: '100vw', desktop: '100vw' }
  }),
  
  logo: {
    src: '/assets/images/logo/logo.svg',
    alt: 'Dental Story логотип',
    width: 200,
    height: 60,
    priority: true,
  },
  
  service: createImageConfig('/assets/images/services/service-placeholder', 'service'),
  
  team: createImageConfig('/assets/images/team/team-placeholder', 'team'),
  
  gallery: createImageConfig('/assets/images/gallery/gallery-placeholder', 'gallery'),
}