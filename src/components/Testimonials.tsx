'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { getReviews, type Review } from '@/services/reviews'

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

const TestimonialCard = ({ review }: { review: Review }) => {
  const { t } = useTranslation()
  const initials = review.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const colors = [
    'bg-teal-800',
    'bg-slate-800',
    'bg-emerald-800',
    'bg-purple-700',
    'bg-pink-700',
    'bg-indigo-700',
  ]
  const bgColor = colors[review.name.charCodeAt(0) % colors.length]

  const dateLabel = review.visitDate
    ? new Date(review.visitDate).toLocaleDateString('uk-UA', {
        month: 'long',
        year: 'numeric',
      })
    : new Date(review.createdAt).toLocaleDateString('uk-UA', {
        month: 'long',
        year: 'numeric',
      })

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`${bgColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
          {initials}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{review.name}</h4>
          <StarRating
            rating={review.rating}
            ariaLabel={t('testimonials.rating', { rating: review.rating })}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{dateLabel}</span>
      </div>

      <p className="text-gray-600 leading-relaxed mb-3">{review.comment}</p>

      {review.service && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-teal-800 font-medium">{review.service}</p>
        </div>
      )}
    </div>
  )
}

const Testimonials = () => {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReviews()
      .then(res => {
        if (res.success && res.data) setReviews(res.data.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">{t('home.testimonials.loadingTitle')}</p>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('testimonials.subtitle')}
          </p>

          {avgRating !== null && (
            <div className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
              <StarRating
                rating={Math.round(avgRating)}
                ariaLabel={t('testimonials.rating', { rating: avgRating })}
              />
              <span className="text-2xl font-bold text-gray-900">
                {avgRating}
              </span>
              <span className="text-gray-500">
                {t('testimonials.basedOn', { count: reviews.length })}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.slice(0, 6).map(review => (
            <TestimonialCard key={review.id} review={review} />
          ))}
        </div>

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
