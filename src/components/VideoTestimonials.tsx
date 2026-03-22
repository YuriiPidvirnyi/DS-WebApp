'use client'

import { useState, useRef } from 'react'
import {
  Play,
  Pause,
  Quote,
  Star,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { AnimatedSection } from '@/components/ui/AnimatedCard'
import Image from 'next/image'

interface VideoTestimonial {
  id: string
  nameKey: string
  treatmentKey: string
  rating: number
  quoteKey: string
  videoThumbnail: string
  videoPoster: string
  // In production, this would be a real video URL
  videoSrc?: string
}

// Demo testimonials - in production these would come from CMS
const testimonials: VideoTestimonial[] = [
  {
    id: '1',
    nameKey: 'videoTestimonials.items.1.name',
    treatmentKey: 'videoTestimonials.items.1.treatment',
    rating: 5,
    quoteKey: 'videoTestimonials.items.1.quote',
    videoThumbnail: '/assets/images/gallery/dental-team.jpg',
    videoPoster: '/assets/images/gallery/dental-team.jpg',
  },
  {
    id: '2',
    nameKey: 'videoTestimonials.items.2.name',
    treatmentKey: 'videoTestimonials.items.2.treatment',
    rating: 5,
    quoteKey: 'videoTestimonials.items.2.quote',
    videoThumbnail: '/assets/images/gallery/clinic-reception.jpg',
    videoPoster: '/assets/images/gallery/clinic-reception.jpg',
  },
  {
    id: '3',
    nameKey: 'videoTestimonials.items.3.name',
    treatmentKey: 'videoTestimonials.items.3.treatment',
    rating: 5,
    quoteKey: 'videoTestimonials.items.3.quote',
    videoThumbnail: '/assets/images/gallery/treatment-room.jpg',
    videoPoster: '/assets/images/gallery/treatment-room.jpg',
  },
]

function VideoCard({
  testimonial,
  isActive,
  onClick,
  t,
}: {
  testimonial: VideoTestimonial
  isActive: boolean
  onClick: () => void
  t: (key: string) => string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else {
      // If no video, just show the overlay
      onClick()
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group ${
        isActive ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={onClick}
    >
      {/* Video/Image */}
      <div className="relative aspect-video">
        {testimonial.videoSrc ? (
          <video
            ref={videoRef}
            src={testimonial.videoSrc}
            poster={testimonial.videoPoster}
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={testimonial.videoThumbnail}
            alt={`${t('videoTestimonials.reviewFrom')} ${t(testimonial.nameKey)}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/50" />

        {/* Play button */}
        <button
          onClick={e => {
            e.stopPropagation()
            togglePlay()
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg"
          aria-label={
            isPlaying
              ? t('videoTestimonials.pause')
              : t('videoTestimonials.playVideo')
          }
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-slate-900" />
          ) : (
            <Play className="h-6 w-6 text-slate-900 ml-1" />
          )}
        </button>

        {/* Mute button */}
        {isPlaying && testimonial.videoSrc && (
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            aria-label={
              isMuted
                ? t('videoTestimonials.unmute')
                : t('videoTestimonials.mute')
            }
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
          </div>

          {/* Quote */}
          <div className="flex gap-2 mb-4">
            <Quote className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm md:text-base leading-relaxed line-clamp-3">
              {t(testimonial.quoteKey)}
            </p>
          </div>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {t(testimonial.nameKey)}
              </p>
              <p className="text-white/70 text-sm">
                {t(testimonial.treatmentKey)}
              </p>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">
              {t('videoTestimonials.videoReview')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VideoTestimonials() {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const { ref, isVisible } = useScrollAnimation()

  const nextTestimonial = () =>
    setActiveIndex(prev => (prev + 1) % testimonials.length)
  const prevTestimonial = () =>
    setActiveIndex(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    )

  return (
    <section
      ref={ref}
      className="py-24 bg-slate-900 text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection isVisible={isVisible} className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-teal-400 tracking-wider uppercase mb-4">
            {t('videoTestimonials.sectionLabel')}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t('videoTestimonials.title')}
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t('videoTestimonials.subtitle')}
          </p>
        </AnimatedSection>

        {/* Main testimonial carousel */}
        <AnimatedSection isVisible={isVisible} delay={200}>
          <div className="relative">
            {/* Navigation buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute -left-4 md:left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label={t('videoTestimonials.previousReview')}
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute -right-4 md:right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label={t('videoTestimonials.nextReview')}
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>

            {/* Testimonials grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:px-16">
              {testimonials.map((testimonial, index) => (
                <VideoCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  isActive={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  t={t}
                />
              ))}
            </div>

            {/* Dots navigation */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'w-8 bg-teal-500'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`${t('videoTestimonials.goToReview')} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Stats bar */}
        <AnimatedSection isVisible={isVisible} delay={400}>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-white/10">
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-400 mb-2">5000+</p>
              <p className="text-slate-400">
                {t('videoTestimonials.stats.satisfiedPatients')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-400 mb-2">98%</p>
              <p className="text-slate-400">
                {t('videoTestimonials.stats.recommendUs')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-400 mb-2">4.9</p>
              <p className="text-slate-400">
                {t('videoTestimonials.stats.googleRating')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-400 mb-2">10+</p>
              <p className="text-slate-400">
                {t('videoTestimonials.stats.yearsExperience')}
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
