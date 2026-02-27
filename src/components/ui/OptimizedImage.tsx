'use client'

import { useState, type ReactElement } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  sizes?: string
  fill?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

/**
 * Optimized image backed by next/image.
 * next/image automatically handles WebP/AVIF conversion, lazy loading,
 * responsive srcsets, and CLS prevention — no custom logic needed.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  sizes,
  fill = false,
  onLoad,
  onError,
}: OptimizedImageProps): ReactElement {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center bg-gray-100 ${className}`}
      >
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
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        width && height && !fill
          ? { aspectRatio: `${width}/${height}` }
          : undefined
      }
    >
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (width ?? 800)}
        height={fill ? undefined : (height ?? 600)}
        fill={fill}
        sizes={sizes ?? (fill ? '100vw' : undefined)}
        quality={quality}
        priority={priority}
        onLoad={() => {
          setIsLoaded(true)
          onLoad?.()
        }}
        onError={() => {
          setHasError(true)
          onError?.(new Error(`Failed to load: ${src}`))
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

export default OptimizedImage
