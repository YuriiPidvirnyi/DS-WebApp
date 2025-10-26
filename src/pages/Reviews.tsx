import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewSchema, type ReviewFormData, SERVICES } from '@/utils/validationSchemas'
import { Input, Textarea, Select, Button, Spinner } from '@/components/ui'
import StarRating from '@/components/StarRating'
import { getReviews, createReview, type Review } from '@/services/reviews'
import { withToast } from '@/utils/toast'
import { CheckCircle } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Review[]>([])
  const [rating, setRating] = useState(5)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema) as any,
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
    }
  })

  useEffect(() => {
    getReviews().then((res) => { if (res.success && res.data) setItems(res.data.items) }).finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data: ReviewFormData) => {
    await withToast(async () => {
      const res = await createReview({
        name: data.name,
        email: data.email || undefined,
        rating: rating,
        service: data.service,
        doctor: data.doctor || undefined,
        comment: data.comment,
        visitDate: data.visitDate || undefined,
        wouldRecommend: data.wouldRecommend,
      } as any)
      if (!res.success) throw new Error('Не вдалося надіслати відгук')
      // Optimistically add
      setItems(prev => [{
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
      }, ...prev])
      reset()
      setRating(5)
      return res
    }, { successMessage: 'Дякуємо за ваш відгук!' })
  }

  return (
    <div className="py-16">
      <Helmet>
        <title>Відгуки пацієнтів — Dental Story</title>
        <meta name="description" content="Оцініть наш сервіс та прочитайте відгуки пацієнтів про лікування у Dental Story." />
        <link rel="canonical" href="https://dentalstory.com.ua/reviews" />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Відгуки пацієнтів</h1>
          <p className="text-gray-600">Поділіться враженнями про візит, це допоможе іншим пацієнтам</p>
        </div>

        {/* List of reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {loading ? (
            <div className="col-span-2 flex justify-center p-8"><Spinner /></div>
          ) : (
            items.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{r.name}</h3>
                  <StarRating value={r.rating} readOnly />
                </div>
                <p className="text-sm text-gray-500 mt-1">Послуга: {r.service}</p>
                <p className="text-gray-700 mt-3">{r.comment}</p>
                <div className="text-xs text-gray-400 mt-3">{new Date(r.createdAt).toLocaleString('uk-UA')}</div>
              </div>
            ))
          )}
        </div>

        {/* Review form */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Залишити відгук</h2>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Ваша оцінка:</span>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="review-name" className="block text-sm font-medium text-gray-700 mb-1">Ім'я *</label>
                <Input id="review-name" aria-label="Ім'я" fullWidth error={errors.name?.message} {...register('name')} />
              </div>
              <div>
                <label htmlFor="review-email" className="block text-sm font-medium text-gray-700 mb-1">Email (необов'язково)</label>
                <Input id="review-email" aria-label="Email" type="email" fullWidth error={errors.email?.message} {...register('email')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="review-service" className="block text-sm font-medium text-gray-700 mb-1">Послуга *</label>
                <Select id="review-service" aria-label="Послуга" fullWidth error={errors.service?.message} {...register('service')}>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="review-doctor" className="block text-sm font-medium text-gray-700 mb-1">Лікар (необов'язково)</label>
                <Input id="review-doctor" aria-label="Лікар" fullWidth error={errors.doctor?.message} {...register('doctor')} />
              </div>
              <div>
                <label htmlFor="review-visitDate" className="block text-sm font-medium text-gray-700 mb-1">Дата візиту (необов'язково)</label>
                <Input id="review-visitDate" type="date" fullWidth error={errors.visitDate?.message} {...register('visitDate')} />
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">Коментар *</label>
              <Textarea id="review-comment" rows={4} fullWidth error={errors.comment?.message} {...register('comment')} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="wouldRecommend" {...register('wouldRecommend')} />
              <label htmlFor="wouldRecommend" className="text-sm text-gray-700">Порадив(ла) б клініку іншим</label>
            </div>

            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded p-3">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">Надсилаючи відгук, ви погоджуєтеся з публікацією тексту на сайті після модерації.</p>
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting}>Надіслати відгук</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
