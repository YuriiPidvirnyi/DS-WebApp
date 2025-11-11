import { useState, useEffect, ImgHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

export interface ResponsiveImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  webpSrc?: string
  fallbackSrc?: string
  srcSet?: string
  webpSrcSet?: string
  sizes?: string
  alt: string
  className?: string
  width?: number
  height?: number
  aspectRatio?: string
  placeholderColor?: string
  priority?: boolean
}

/**
 * ResponsiveImage component with WebP support and lazy loading
 *
 * Features:
 * - Automatic WebP format support with fallback
 * - Lazy loading for better performance
 * - Responsive image with srcset and sizes
 * - Placeholder with aspect ratio for reduced layout shift
 * - Priority loading for above-the-fold images
 * - Optional blur-up effect for image loading
 */
export default function ResponsiveImage({
  src,
  webpSrc,
  fallbackSrc,
  srcSet,
  webpSrcSet,
  sizes = '100vw',
  alt,
  className,
  width,
  height,
  aspectRatio,
  placeholderColor = '#f5f5f5',
  priority = false,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(priority)
  const [error, setError] = useState(false)

  // Generate an aspect ratio style if dimensions are provided
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : width && height
      ? { aspectRatio: `${width} / ${height}` }
      : {}

  // Handle image errors
  const handleError = () => {
    if (fallbackSrc && src !== fallbackSrc) {
      setError(true)
    }
  }

  // Load high-priority images immediately
  useEffect(() => {
    if (priority) {
      setIsLoaded(true)
    }
  }, [priority])

  // Determine which image source to use
  const displaySrc = error ? fallbackSrc || src : src

  return (
    <div
      className={twMerge(
        'relative overflow-hidden bg-no-repeat bg-center',
        !isLoaded && 'bg-animate-pulse',
        className
      )}
      style={{
        backgroundColor: placeholderColor,
        ...aspectRatioStyle,
      }}
    >
      <picture>
        {webpSrc && !error && (
          <source
            type="image/webp"
            srcSet={webpSrcSet || webpSrc}
            sizes={sizes}
          />
        )}
        <img
          src={displaySrc}
          srcSet={!error ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={twMerge(
            'w-full h-full object-cover transition-opacity duration-500',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          {...props}
        />
      </picture>
    </div>
  )
}
