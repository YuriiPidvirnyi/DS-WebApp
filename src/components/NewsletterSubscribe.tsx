import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from '@/components/ui'
import { newsletterSchema } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { withToast } from '@/utils/toast'
import { subscribeNewsletter } from '@/services/subscriptions'

type NewsletterValues = z.infer<typeof newsletterSchema>

export default function NewsletterSubscribe() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', consent: true },
  })

  const onSubmit = async (data: NewsletterValues) => {
    await withToast(
      async () => {
        const res = await subscribeNewsletter(data.email)
        if (!res.success) throw new Error('Не вдалося підписатися')
        return res
      },
      { formType: 'newsletter' }
    )
    reset({ email: '', consent: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" aria-label="Форма підписки на розсилку">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input 
            placeholder="Ваш email" 
            fullWidth 
            error={errors.email?.message}
            {...register('email')} 
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Підписатись
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <input id="newsletter-consent" type="checkbox" className="mt-1" {...register('consent')} />
        <label htmlFor="newsletter-consent" className="text-xs text-gray-300">
          Погоджуюся отримувати новини та акції на email
        </label>
      </div>
      {isSubmitSuccessful && (
        <p className="text-xs text-green-400">Дякуємо! Ви підписані.</p>
      )}
    </form>
  )
}
