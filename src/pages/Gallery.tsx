import { useState } from 'react'
import { X } from 'lucide-react'
import type { GalleryImage } from '@/types'

// Mock gallery data з placeholder зображеннями
const galleryImages: GalleryImage[] = [
  // Clinic
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80',
    title: 'Ресепшн клініки',
    category: 'clinic',
    description: 'Сучасний та затишний ресепшн для комфорту наших пацієнтів',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    title: 'Лікувальний кабінет',
    category: 'clinic',
    description: 'Сучасні кабінети з найновішим обладнанням',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
    title: 'Зона очікування',
    category: 'clinic',
    description: 'Комфортна зона очікування з Wi-Fi та напоями',
  },

  // Equipment
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    title: 'Стоматологічне крісло',
    category: 'equipment',
    description: 'Ергономічне крісло для максимального комфорту пацієнта',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80',
    title: '3D томограф',
    category: 'equipment',
    description: 'Сучасний 3D томограф для точної діагностики',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1611177729567-3cc21f7a9a4d?w=800&q=80',
    title: 'Стоматологічні інструменти',
    category: 'equipment',
    description: 'Стерилізовані інструменти найвищої якості',
  },

  // Team
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80',
    title: 'Наша команда',
    category: 'team',
    description: 'Команда професіональних стоматологів',
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80',
    title: 'Робочий процес',
    category: 'team',
    description: 'Наші лікарі за роботою',
  },

  // Before/After
  {
    id: '9',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    title: 'Відбілювання зубів',
    category: 'before-after',
    description: 'Результат професійного відбілювання',
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80',
    title: 'Імплантація',
    category: 'before-after',
    description: 'Успішна імплантація зубів',
  },
]

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
            Галерея
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Подивіться на нашу сучасну клініку, обладнання та результати нашої
            роботи
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-dental-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
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
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              Фотографій в цій категорії поки немає
            </p>
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
          aria-label="Перегляд зображення"
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Закрити"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 text-white hover:text-gray-300 transition-colors text-4xl"
            onClick={e => {
              e.stopPropagation()
              navigateImage('prev')
            }}
            aria-label="Попереднє зображення"
          >
            ‹
          </button>

          <button
            className="absolute right-4 text-white hover:text-gray-300 transition-colors text-4xl"
            onClick={e => {
              e.stopPropagation()
              navigateImage('next')
            }}
            aria-label="Наступне зображення"
          >
            ›
          </button>

          <div
            className="max-w-5xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
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
