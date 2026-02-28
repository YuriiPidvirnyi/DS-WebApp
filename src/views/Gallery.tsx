'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import type { GalleryImage } from '@/types'
import galleryData from '@/content/gallery.json'

const galleryImages: GalleryImage[] = galleryData as unknown as GalleryImage[]

const categories = [
  { value: 'all', label: 'Всі фото' },
  { value: 'clinic', label: 'Клініка' },
  { value: 'equipment', label: 'Обладнання' },
  { value: 'team', label: 'Команда' },
  { value: 'before-after', label: 'До/Після' },
]

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const filteredImages =
    selectedCategory === 'all'
      ? galleryImages
      : galleryImages.filter(img => img.category === selectedCategory)

  const openLightbox = useCallback((image: GalleryImage) => {
    setSelectedImage(image)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeLightbox = useCallback(() => {
    setSelectedImage(null)
    document.body.style.overflow = 'unset'
  }, [])

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (!selectedImage) return
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id)
    let newIndex
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1
    }
    setSelectedImage(filteredImages[newIndex])
  }, [selectedImage, filteredImages])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') navigateImage('prev')
      if (e.key === 'ArrowRight') navigateImage('next')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, closeLightbox, navigateImage])

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">
            Фотогалерея
          </span>
          <h1 className="mb-4">Галерея</h1>
          <p className="text-responsive-base max-w-2xl mx-auto">
            Подивіться на нашу сучасну клініку, обладнання та результати роботи
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredImages.map(image => (
            <button
              key={image.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => openLightbox(image)}
            >
              <Image
                src={image.url}
                alt={image.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-background/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                    <ZoomIn className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-background">
                  <h3 className="font-semibold text-base sm:text-lg mb-1">{image.title}</h3>
                  {image.description && (
                    <p className="text-sm text-background/80 line-clamp-2">{image.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Фотографій в цій категорії поки немає
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-foreground/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Перегляд зображення"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-background/10 hover:bg-background/20 rounded-full flex items-center justify-center text-background transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            className="absolute left-4 w-12 h-12 bg-background/10 hover:bg-background/20 rounded-full flex items-center justify-center text-background transition-colors"
            onClick={e => {
              e.stopPropagation()
              navigateImage('prev')
            }}
            aria-label="Попереднє зображення"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            className="absolute right-4 w-12 h-12 bg-background/10 hover:bg-background/20 rounded-full flex items-center justify-center text-background transition-colors"
            onClick={e => {
              e.stopPropagation()
              navigateImage('next')
            }}
            aria-label="Наступне зображення"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full">
              <Image
                src={selectedImage.url}
                alt={selectedImage.title}
                fill
                sizes="100vw"
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <div className="mt-4 text-center text-background">
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                {selectedImage.title}
              </h3>
              {selectedImage.description && (
                <p className="text-background/70">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
