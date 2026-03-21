'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import type { Testimonial } from '@/types'

const StarRating = ({
  rating,
  ariaLabel,
}: {
  rating: number
  ariaLabel: string
}) => {
  return (
    <div className="flex gap-1">
      <span className="sr-only">{ariaLabel}</span>
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`h-5 w-5 ${
            index < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const { t } = useTranslation()
  // Generate initials for avatar fallback
  const initials = testimonial.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Generate deterministic background color from name
  const colors = [
    'bg-teal-800',
    'bg-slate-800',
    'bg-emerald-800',
    'bg-purple-700',
    'bg-pink-700',
    'bg-indigo-700',
  ]
  const colorIndex = testimonial.name.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div
          className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
          {initials}
        </div>

        {/* Name and Rating */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {testimonial.name}
          </h4>
          <StarRating
            rating={testimonial.rating}
            ariaLabel={t('testimonials.rating', { rating: testimonial.rating })}
          />
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-600 leading-relaxed mb-3">{testimonial.text}</p>

      {/* Service */}
      {testimonial.service && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-teal-800 font-medium">
            {testimonial.service}
          </p>
        </div>
      )}
    </div>
  )
}

const Testimonials = () => {
  const { t } = useTranslation()
  const translatedItems = t('testimonials.items', {
    returnObjects: true,
  }) as unknown
  const testimonials = Array.isArray(translatedItems)
    ? (translatedItems as Testimonial[])
    : []

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('testimonials.subtitle')}
          </p>

          {/* Rating Summary */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
            <StarRating
              rating={5}
              ariaLabel={t('testimonials.rating', { rating: 5 })}
            />
            <span className="text-2xl font-bold text-gray-900">4.9</span>
            <span className="text-gray-500">
              {t('testimonials.basedOn', { count: 523 })}
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map(testimonial => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('testimonials.cta.question')}</p>
          <Link
            href="/booking"
            className="inline-block bg-teal-800 hover:bg-teal-900 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {t('testimonials.cta.button')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
