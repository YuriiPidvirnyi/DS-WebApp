'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

interface LazyImageProps {
  src: string
  /** Shown if src fails to load */
  fallback?: string
  alt: string
  className?: string
  width?: number
  height?: number
  /** 'eager' maps to priority on next/image */
  loading?: 'lazy' | 'eager'
  /** Kept for API compatibility — next/image uses blurDataURL internally */
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  fill?: boolean
  sizes?: string
}

/**
 * Lazy-loading image backed by next/image.
 * next/image automatically handles lazy loading, WebP/AVIF conversion,
 * responsive srcsets and CLS prevention.
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  fallback,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  fill = false,
  sizes,
}) => {
  const { t } = useTranslation()
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const displaySrc = hasError && fallback ? fallback : src

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-dental-secondary-100 flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-dental-teal rounded-full animate-pulse" />
            <div
              className="w-2 h-2 bg-dental-teal rounded-full animate-pulse"
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className="w-2 h-2 bg-dental-teal rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>
      )}

      {hasError && !fallback ? (
        <div className="absolute inset-0 bg-dental-secondary-100 flex items-center justify-center text-dental-muted text-sm">
          {t('lazyImage.unavailable')}
        </div>
      ) : (
        <Image
          src={displaySrc}
          alt={alt}
          width={fill ? undefined : (width ?? 800)}
          height={fill ? undefined : (height ?? 600)}
          fill={fill}
          sizes={sizes ?? (fill ? '100vw' : undefined)}
          priority={loading === 'eager'}
          onLoad={() => {
            setIsLoaded(true)
            onLoad?.()
          }}
          onError={() => {
            if (!hasError) setHasError(true)
            onError?.()
          }}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-70'
          } w-full h-full object-cover`}
        />
      )}
    </div>
  )
}

export default LazyImage
