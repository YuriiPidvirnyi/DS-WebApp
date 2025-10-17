import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button } from '@/components/ui'
import { callbackSchema } from '@/utils/validationSchemas'
import type { z } from 'zod'
import { withToast } from '@/utils/toast'
import { mockAPIResponse } from '@/services/api'

// Simple mock callback service (can be replaced with real service later)
async function createCallback(_payload: { name: string; phone: string; preferredTime: string; service?: string }) {
  return mockAPIResponse({ id: `cb-${Date.now()}` }, 500)
}

type CallbackValues = z.infer<typeof callbackSchema>

export default function CallbackRequest() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<CallbackValues>({
    resolver: zodResolver(callbackSchema) as any,
    defaultValues: { name: '', phone: '', preferredTime: 'any', service: '', consent: true },
  })

  const onSubmit = async (data: CallbackValues) => {
    await withToast(
      async () => {
        const res = await createCallback({ name: data.name, phone: data.phone, preferredTime: data.preferredTime, service: data.service })
        if (!res.success) throw new Error('Не вдалося надіслати заявку')
        return res
      },
      { formType: 'callback' }
    )
    reset({ name: '', phone: '', preferredTime: 'any', service: '', consent: true })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Швидкий зворотний дзвінок</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="Ваше ім'я" fullWidth error={errors.name?.message} {...register('name')} />
        <Input type="tel" placeholder="Номер телефону" fullWidth error={errors.phone?.message} {...register('phone')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="px-4 py-3 border rounded-lg" {...register('preferredTime')}>
            <option value="any">Будь-коли</option>
            <option value="morning">Ранок</option>
            <option value="afternoon">День</option>
            <option value="evening">Вечір</option>
          </select>
          <Input placeholder="Послуга (необов'язково)" {...register('service')} />
        </div>
        <div className="flex items-start gap-2">
          <input id="cb-consent" type="checkbox" className="mt-1" {...register('consent')} />
          <label htmlFor="cb-consent" className="text-xs text-gray-600">Погоджуюся на обробку персональних даних</label>
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting}>Замовити дзвінок</Button>
        {isSubmitSuccessful && <p className="text-xs text-green-600">Дякуємо! Ми зателефонуємо найближчим часом.</p>}
      </form>
    </div>
  )
}
