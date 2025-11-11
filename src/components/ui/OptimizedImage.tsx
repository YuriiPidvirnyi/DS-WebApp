import { useState, useEffect, useRef } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean // Load immediately
  quality?: number
  placeholder?: 'blur' | 'empty'
  sizes?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

/**
 * Optimized image component with:
 * - Lazy loading with Intersection Observer
 * - Modern image format support (WebP/AVIF fallbacks)
 * - Responsive srcset
 * - Low-quality image placeholder (LQIP)
 * - Aspect ratio preservation to prevent CLS
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver>()

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    )

    const currentRef = imgRef.current
    if (currentRef) {
      observerRef.current.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observerRef.current?.unobserve(currentRef)
      }
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.(new Error(`Failed to load image: ${src}`))
  }

  // Generate srcset for responsive images
  const generateSrcSet = (): string => {
    if (!width) return ''

    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    const applicableWidths = widths.filter(w => w <= width)

    return applicableWidths
      .map(w => {
        return `${src}?w=${w}&q=${quality} ${w}w`
      })
      .join(', ')
  }

  // Generate sizes attribute
  const getSizes = (): string => {
    if (sizes) return sizes
    if (width) return `${width}px`
    return '100vw'
  }

  // Calculate aspect ratio padding
  const aspectRatio = width && height ? (height / width) * 100 : undefined

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <picture>
          {/* AVIF format (best compression, limited support) */}
          <source
            type="image/avif"
            srcSet={generateSrcSet().replace(/\?/g, '.avif?')}
            sizes={getSizes()}
          />

          {/* WebP format (good compression, wide support) */}
          <source
            type="image/webp"
            srcSet={generateSrcSet().replace(/\?/g, '.webp?')}
            sizes={getSizes()}
          />

          {/* Fallback to original format */}
          <img
            ref={imgRef}
            src={src}
            srcSet={generateSrcSet()}
            sizes={getSizes()}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`
              absolute inset-0 w-full h-full object-cover
              transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Не вдалось завантажити зображення
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage
