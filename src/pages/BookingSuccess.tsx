import { useSearchParams, Link } from 'react-router-dom'

export default function BookingSuccess() {
  const [params] = useSearchParams()
  const ref = params.get('ref')

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Дякуємо! Запис створено</h1>
        <p className="text-gray-600 mb-6">Ми зв'яжемося з вами для підтвердження найближчим часом.</p>
        {ref && (
          <p className="text-sm text-gray-500 mb-8">Номер заявки: <span className="font-mono">{ref}</span></p>
        )}
        <div className="flex justify-center gap-3">
          <Link to="/" className="px-5 py-2 rounded-lg bg-dental-teal text-white">На головну</Link>
          <Link to="/booking" className="px-5 py-2 rounded-lg bg-gray-100 text-gray-800">Створити ще один запис</Link>
        </div>
      </div>
    </div>
  )
}
