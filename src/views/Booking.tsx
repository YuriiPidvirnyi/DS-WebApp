'use client'

import BookingForm from '@/components/BookingForm'

export default function BookingPage() {
  return (
    <div className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Запис на прийом
          </h1>
          <p className="text-lg text-gray-600">
            Оберіть зручний час і ми підтвердимо запис найближчим часом
          </p>
        </div>
        <BookingForm />
      </div>
    </div>
  )
}
