'use client'

import { useState } from 'react'
import Image from 'next/image'
import { twMerge } from 'tailwind-merge'

export interface ResponsiveImageProps {
  src: string
  /** Deprecated — next/image handles WebP automatically */
  webpSrc?: string
  fallbackSrc?: string
  sizes?: string
  alt: string
  className?: string
  width?: number
  height?: number
  aspectRatio?: string
  placeholderColor?: string
  priority?: boolean
  fill?: boolean
  quality?: number
}

/**
 * Responsive image backed by next/image.
 * next/image automatically serves WebP/AVIF, lazy-loads, and generates
 * responsive srcsets — eliminating the need for manual picture/source tags.
 */
export default function ResponsiveImage({
  src,
  fallbackSrc,
  sizes = '100vw',
  alt,
  className,
  width,
  height,
  aspectRatio,
  placeholderColor = '#f5f5f5',
  priority = false,
  fill = false,
  quality = 75,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src

  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : width && height
      ? { aspectRatio: `${width} / ${height}` }
      : {}

  return (
    <div
      className={twMerge(
        'relative overflow-hidden bg-no-repeat bg-center',
        !isLoaded && 'animate-pulse',
        className
      )}
      style={{ backgroundColor: placeholderColor, ...aspectRatioStyle }}
    >
      <Image
        src={displaySrc}
        alt={alt}
        width={fill ? undefined : (width ?? 800)}
        height={fill ? undefined : (height ?? 600)}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        onLoad={() => setIsLoaded(true)}
        onError={() => { if (!hasError) setHasError(true) }}
        className={twMerge(
          'w-full h-full object-cover transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )
}
