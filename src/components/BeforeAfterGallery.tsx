'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { AnimatedSection } from '@/components/ui/AnimatedCard'

interface BeforeAfterCase {
  id: string
  title: string
  description: string
  beforeImage: string
  afterImage: string
  treatment: string
  duration: string
}

// Demo cases - in production these would come from a CMS/database
const cases: BeforeAfterCase[] = [
  {
    id: '1',
    title: 'Відновлення посмішки',
    description: 'Комплексне лікування та встановлення вінірів',
    beforeImage: '/assets/images/gallery/dental-equipment.jpg',
    afterImage: '/assets/images/gallery/treatment-room.jpg',
    treatment: 'Вініри',
    duration: '2 тижні',
  },
  {
    id: '2',
    title: 'Імплантація зубів',
    description: 'Заміна відсутніх зубів на імпланти з коронками',
    beforeImage: '/assets/images/gallery/clinic-reception.jpg',
    afterImage: '/assets/images/gallery/dental-team.jpg',
    treatment: 'Імплантація',
    duration: '3 місяці',
  },
  {
    id: '3',
    title: 'Виправлення прикусу',
    description: 'Ортодонтичне лікування брекетами',
    beforeImage: '/assets/images/services/orthodontics.jpg',
    afterImage: '/assets/images/services/teeth-whitening.jpg',
    treatment: 'Ортодонтія',
    duration: '18 місяців',
  },
]

// Before/After Slider Component
function ComparisonSlider({ beforeImage, afterImage, t }: { beforeImage: string; afterImage: string; t: (key: string) => string }) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  const handleStart = () => setIsDragging(true)
  const handleEnd = () => setIsDragging(false)

  useEffect(() => {
    const handleGlobalEnd = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalEnd)
    window.addEventListener('touchend', handleGlobalEnd)
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd)
      window.removeEventListener('touchend', handleGlobalEnd)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden cursor-ew-resize select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
    >
      {/* After image (full width, underneath) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt="Після лікування"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-dental-primary-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          {t('labels.after')}
        </div>
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="До лікування"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          draggable={false}
        />
        <div className="absolute top-4 left-4 bg-dental-primary-900 text-white px-3 py-1.5 rounded-full text-sm font-medium">
          {t('labels.before')}
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="h-4 w-4 text-slate-700" />
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Instruction overlay */}
      {!isDragging && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm pointer-events-none animate-pulse">
          Перетягніть для порівняння
        </div>
      )}
    </div>
  )
}

export default function BeforeAfterGallery() {
  const { t } = useTranslation()
  const [activeCase, setActiveCase] = useState(0)
  const { ref, isVisible } = useScrollAnimation()

  const nextCase = () => setActiveCase((prev) => (prev + 1) % cases.length)
  const prevCase = () => setActiveCase((prev) => (prev - 1 + cases.length) % cases.length)

  const currentCase = cases[activeCase]

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection isVisible={isVisible} className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-dental-primary-600 tracking-wider uppercase mb-4">
            {t('caseStudies.results')}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6 leading-tight">
            {t('caseStudies.beforeAfter')}
          </h2>
          <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
            {t('caseStudies.description')}
          </p>
        </AnimatedSection>

        <AnimatedSection isVisible={isVisible} delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Comparison Slider */}
            <div className="relative">
              <ComparisonSlider
                beforeImage={currentCase.beforeImage}
                afterImage={currentCase.afterImage}
                t={t}
              />
              
              {/* Navigation arrows */}
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  onClick={prevCase}
                  className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-dental-secondary-50 transition-colors"
                  aria-label={t('accessibility.prevCase')}
                >
                  <ChevronLeft className="h-6 w-6 text-dental-dark" />
                </button>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                <button
                  onClick={nextCase}
                  className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-dental-secondary-50 transition-colors"
                  aria-label={t('accessibility.nextCase')}
                >
                  <ChevronRight className="h-6 w-6 text-dental-dark" />
                </button>
              </div>
            </div>

            {/* Case details */}
            <div className="lg:pl-8">
              <div className="mb-6">
                <span className="inline-block bg-dental-primary-50 text-dental-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  {currentCase.treatment}
                </span>
                <h3 className="text-3xl font-bold text-dental-dark mb-3">
                  {currentCase.title}
                </h3>
                <p className="text-lg text-dental-muted leading-relaxed">
                  {currentCase.description}
                </p>
              </div>

              <div className="flex items-center gap-8 mb-8">
                <div>
                  <p className="text-sm text-dental-muted mb-1">{t('caseStudies.duration')}</p>
                  <p className="text-xl font-bold text-dental-dark">{currentCase.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-dental-muted mb-1">{t('caseStudies.procedureType')}</p>
                  <p className="text-xl font-bold text-dental-dark">{currentCase.treatment}</p>
                </div>
              </div>

              {/* Case indicators */}
              <div className="flex items-center gap-2">
                {cases.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCase(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === activeCase
                        ? 'w-8 bg-dental-primary-500'
                        : 'bg-dental-secondary-300 hover:bg-dental-secondary-400'
                    }`}
                    aria-label={`${t('accessibility.goToCase')} ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
