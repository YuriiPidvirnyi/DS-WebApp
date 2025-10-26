import React, { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  fallback?: string
  alt: string
  className?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  fallback,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = '/assets/images/gallery/gallery-placeholder.svg',
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder)
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Only start loading if we're using native lazy loading or the image is in viewport
    if (loading === 'eager') {
      loadImage()
    } else {
      // Use Intersection Observer for better control
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage()
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current)
              }
            }
          })
        },
        { threshold: 0.1, rootMargin: '50px' }
      )

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current)
      }
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current)
      }
    }
  }, [src, loading])

  const loadImage = () => {
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(src)
      setImageStatus('loaded')
      onLoad?.()
    }
    
    img.onerror = () => {
      if (fallback) {
        const fallbackImg = new Image()
        fallbackImg.onload = () => {
          setImageSrc(fallback)
          setImageStatus('loaded')
        }
        fallbackImg.onerror = () => {
          setImageSrc(placeholder)
          setImageStatus('error')
          onError?.()
        }
        fallbackImg.src = fallback
      } else {
        setImageSrc(placeholder)
        setImageStatus('error')
        onError?.()
      }
    }
    
    img.src = src
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`transition-opacity duration-300 ${
          imageStatus === 'loading' ? 'opacity-70' : 'opacity-100'
        } w-full h-full object-cover`}
        style={{ 
          aspectRatio: width && height ? `${width}/${height}` : undefined 
        }}
      />
      
      {/* Loading overlay */}
      {imageStatus === 'loading' && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-dental-teal rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-dental-teal rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-dental-teal rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {imageStatus === 'error' && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Зображення недоступне
        </div>
      )}
    </div>
  )
}

export default LazyImage