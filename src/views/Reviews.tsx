'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  reviewSchema,
  type ReviewFormData,
  SERVICES,
} from '@/utils/validationSchemas'
import { Input, Textarea, Select, Button, AsyncState } from '@/components/ui'
import StarRating from '@/components/StarRating'
import { getReviews, createReview, type Review } from '@/services/reviews'
import { isAPIError } from '@/services/api'
import { withToast } from '@/utils/toast'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ReviewsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema) as Resolver<ReviewFormData>,
    defaultValues: {
      name: '',
      email: '',
      rating: 5,
      service: SERVICES[0],
      doctor: '',
      comment: '',
      visitDate: '',
      wouldRecommend: true,
      consent: true,
    },
  })

  const loadReviews = useCallback(async () => {
    setLoading(true)

    try {
      const res = await getReviews()
      if (res.success && res.data) {
        setItems(res.data.items)
        setLoadError(null)
        return
      }

      setLoadError(res.error || t('reviews.list.loadError'))
    } catch (err) {
      if (isAPIError(err) && err.code === 'ABORTED') {
        setLoadError(t('reviews.list.timeoutError'))
      } else {
        setLoadError(t('reviews.list.loadError'))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await withToast(
        async () => {
          const res = await createReview({
            name: data.name,
            email: data.email || undefined,
            rating: rating,
            service: data.service,
            doctor: data.doctor || undefined,
            comment: data.comment,
            visitDate: data.visitDate || undefined,
            wouldRecommend: data.wouldRecommend,
          })
          if (!res.success) throw new Error(t('reviews.form.submitError'))
          // Optimistically add
          setItems(prev => [
            {
              id: res.data?.id || `tmp-${Date.now()}`,
              name: data.name,
              email: data.email || undefined,
              rating: rating,
              service: data.service,
              doctor: data.doctor || undefined,
              comment: data.comment,
              visitDate: data.visitDate || undefined,
              wouldRecommend: data.wouldRecommend,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
          reset()
          setRating(5)
          return res
        },
        { successMessage: t('reviews.form.successMessage') }
      )
    } catch {
      // withToast already shows a user-facing error message
    }
  }

  return (
    <div className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('reviews.title')}
          </h1>
          <p className="text-gray-600">{t('reviews.subtitle')}</p>
        </div>

        {/* List of reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {loading ? (
            <AsyncState
              variant="loading"
              title={t('reviews.list.loadingTitle')}
              message={t('reviews.list.loadingMessage')}
              className="col-span-2"
            />
          ) : loadError ? (
            <AsyncState
              variant="error"
              message={loadError}
              actionLabel={t('asyncState.actions.retry')}
              onAction={() => void loadReviews()}
              className="col-span-2"
            />
          ) : items.length === 0 ? (
            <AsyncState
              variant="empty"
              message={t('reviews.list.empty')}
              className="col-span-2"
            />
          ) : (
            items.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{r.name}</h3>
                  <StarRating value={r.rating} readOnly />
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {t('reviews.serviceLabel')}: {r.service}
                </p>
                <p className="text-gray-700 mt-3">{r.comment}</p>
                <div className="text-xs text-gray-600 mt-3">
                  {new Date(r.createdAt).toLocaleString('uk-UA')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Review form */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t('reviews.form.title')}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">
                {t('reviews.form.yourRating')}:
              </span>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="review-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('reviews.form.name')} *
                </label>
                <Input
                  id="review-name"
                  aria-label={t('reviews.form.name')}
                  fullWidth
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <div>
                <label
                  htmlFor="review-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('reviews.form.email')}
                </label>
                <Input
                  id="review-email"
                  aria-label={t('reviews.form.email')}
                  type="email"
                  fullWidth
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="review-service"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('reviews.form.service')} *
                </label>
                <Select
                  id="review-service"
                  aria-label={t('reviews.form.service')}
                  fullWidth
                  error={errors.service?.message}
                  {...register('service')}
                >
                  {SERVICES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="review-doctor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('reviews.form.doctor')}
                </label>
                <Input
                  id="review-doctor"
                  aria-label={t('reviews.form.doctor')}
                  fullWidth
                  error={errors.doctor?.message}
                  {...register('doctor')}
                />
              </div>
              <div>
                <label
                  htmlFor="review-visitDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('reviews.form.visitDate')}
                </label>
                <Input
                  id="review-visitDate"
                  type="date"
                  fullWidth
                  error={errors.visitDate?.message}
                  {...register('visitDate')}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('reviews.form.comment')} *
              </label>
              <Textarea
                id="review-comment"
                rows={4}
                fullWidth
                error={errors.comment?.message}
                {...register('comment')}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wouldRecommend"
                {...register('wouldRecommend')}
              />
              <label htmlFor="wouldRecommend" className="text-sm text-gray-700">
                {t('reviews.form.wouldRecommend')}
              </label>
            </div>

            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded p-3">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">{t('reviews.form.consent')}</p>
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting}>
              {t('reviews.form.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
