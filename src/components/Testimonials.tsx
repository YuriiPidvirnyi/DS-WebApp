import { Star } from 'lucide-react'
import type { Testimonial } from '@/types'

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Олена Шевченко',
    rating: 5,
    text: 'Чудова клініка! Лікарі професіонали своєї справи. Робили імплантацію - все пройшло безболісно та швидко. Дуже вдячна всій команді за турботу та якісну роботу.',
    service: 'Імплантація зубів',
    date: '2024-09-15',
  },
  {
    id: '2',
    name: 'Андрій Коваленко',
    rating: 5,
    text: 'Найкраща стоматологія в Києві! Ставили брекети дочці - результат перевершив всі очікування. Лікар-ортодонт дуже уважна, все пояснює зрозумілою мовою.',
    service: 'Ортодонтія',
    date: '2024-08-28',
  },
  {
    id: '3',
    name: 'Марія Бондаренко',
    rating: 5,
    text: 'Дякую за професійне відбілювання! Посмішка як у голлівудських зірок. Процедура комфортна, без неприємних відчуттів. Рекомендую всім!',
    service: 'Відбілювання зубів',
    date: '2024-09-02',
  },
  {
    id: '4',
    name: 'Віктор Мельник',
    rating: 5,
    text: 'Вперше не боявся йти до стоматолога. Сучасне обладнання, привітний персонал, якісна анестезія. Лікування пройшло швидко і абсолютно безболісно.',
    service: 'Лікування зубів',
    date: '2024-08-10',
  },
  {
    id: '5',
    name: 'Юлія Петрова',
    rating: 5,
    text: 'Робила професійну чистку зубів. Дуже задоволена результатом! Гігієніст працює акуратно та ретельно. Відчуття свіжості та чистоти після процедури - неймовірне.',
    service: 'Професійна гігієна',
    date: '2024-09-20',
  },
  {
    id: '6',
    name: 'Ігор Сидоренко',
    rating: 5,
    text: 'Ставив коронки - якість на найвищому рівні. Колір підібрали ідеально, сидять як рідні. Дякую лікарю за професіоналізм та терпіння!',
    service: 'Протезування',
    date: '2024-07-25',
  },
]

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1" aria-label={`Рейтинг: ${rating} з 5 зірок`}>
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
  // Генеруємо ініціали для аватара
  const initials = testimonial.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Генеруємо колір фону на основі імені
  const colors = [
    'bg-dental-blue',
    'bg-dental-teal',
    'bg-dental-green',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
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
          <StarRating rating={testimonial.rating} />
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-600 leading-relaxed mb-3">{testimonial.text}</p>

      {/* Service */}
      {testimonial.service && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-dental-teal font-medium">
            {testimonial.service}
          </p>
        </div>
      )}
    </div>
  )
}

const Testimonials = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Відгуки наших пацієнтів
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Щастя наших пацієнтів - наша найкраща нагорода. Читайте реальні
            відгуки людей, які довірили нам своє здоров'я
          </p>

          {/* Rating Summary */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
            <StarRating rating={5} />
            <span className="text-2xl font-bold text-gray-900">4.9</span>
            <span className="text-gray-500">на основі 523 відгуків</span>
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
          <p className="text-gray-600 mb-4">
            Хочете стати частиною нашої щасливої сім'ї пацієнтів?
          </p>
          <a
            href="/contact"
            className="inline-block bg-dental-teal hover:bg-teal-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Записатися на прийом
          </a>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
