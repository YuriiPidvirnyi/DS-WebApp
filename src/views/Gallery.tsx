'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Image from 'next/image'
import { AsyncState } from '@/components/ui'
import type { GalleryImage } from '@/types'
import galleryData from '@/content/gallery.json'

// Local gallery data (replaces external Unsplash links). Drop real photos into public/assets/images and update src/content/gallery.json
const galleryImages: GalleryImage[] = galleryData as unknown as GalleryImage[]

const categoryKeys = [
  { value: 'all', labelKey: 'gallery.categories.all' },
  { value: 'clinic', labelKey: 'gallery.categories.clinic' },
  { value: 'equipment', labelKey: 'gallery.categories.equipment' },
  { value: 'team', labelKey: 'gallery.categories.team' },
  { value: 'before-after', labelKey: 'gallery.categories.beforeAfter' },
]

const Gallery = () => {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const filteredImages =
    selectedCategory === 'all'
      ? galleryImages
      : galleryImages.filter(img => img.category === selectedCategory)

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setSelectedImage(null)
    document.body.style.overflow = 'unset'
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return

    const currentIndex = filteredImages.findIndex(
      img => img.id === selectedImage.id
    )

    let newIndex
    if (direction === 'prev') {
      newIndex =
        currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1
    } else {
      newIndex =
        currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1
    }

    setSelectedImage(filteredImages[newIndex])
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedImage) return

    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') navigateImage('prev')
    if (e.key === 'ArrowRight') navigateImage('next')
  }

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('gallery.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categoryKeys.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-dental-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(category.labelKey)}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map(image => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer bg-gray-100"
              onClick={() => openLightbox(image)}
            >
              <Image
                src={image.url}
                alt={image.title}
                width={400}
                height={256}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg mb-1">{image.title}</h3>
                  {image.description && (
                    <p className="text-sm text-gray-200">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="py-8">
            <AsyncState variant="empty" message={t('gallery.noPhotos')} />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label={t('gallery.navigation.viewImage')}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={closeLightbox}
            aria-label={t('gallery.navigation.close')}
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 text-white hover:text-gray-300 transition-colors text-4xl"
            onClick={e => {
              e.stopPropagation()
              navigateImage('prev')
            }}
            aria-label={t('gallery.navigation.previous')}
          >
            ‹
          </button>

          <button
            className="absolute right-4 text-white hover:text-gray-300 transition-colors text-4xl"
            onClick={e => {
              e.stopPropagation()
              navigateImage('next')
            }}
            aria-label={t('gallery.navigation.next')}
          >
            ›
          </button>

          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <Image
              src={selectedImage.url}
              alt={selectedImage.title}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              priority
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-2xl font-semibold mb-2">
                {selectedImage.title}
              </h3>
              {selectedImage.description && (
                <p className="text-gray-300">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
