import { Check } from 'lucide-react'
import FAQAccordion from '@/components/FAQAccordion'
import { ALL_FAQS } from '@/content/faqs'

const Services = () => {
  const services = [
    {
      category: 'Терапевтична стоматологія',
      description: 'Лікування та профілактика захворювань зубів',
      services: [
        'Лікування карієсу',
        'Ендодонтичне лікування',
        'Лікування пульпіту',
        'Лікування періодонтиту',
        'Професійна гігієна',
        'Реставрація зубів',
      ]
    },
    {
      category: 'Хірургічна стоматологія',
      description: 'Хірургічні втручання в порожнині рота',
      services: [
        'Видалення зубів',
        'Видалення зубів мудрості',
        'Імплантація зубів',
        'Синус-ліфтинг',
        'Кісткова пластика',
        'Лікування пародонтиту',
      ]
    },
    {
      category: 'Ортопедична стоматологія',
      description: 'Відновлення зубів та їх функцій',
      services: [
        'Металокерамічні коронки',
        'Безметалеві коронки',
        'Мостоподібні протези',
        'Знімні протези',
        'Вінири',
        'Люмінири',
      ]
    },
    {
      category: 'Ортодонтія',
      description: 'Виправлення прикусу та положення зубів',
      services: [
        'Металеві брекети',
        'Керамічні брекети',
        'Сапфірові брекети',
        'Лінгвальні брекети',
        'Елайнери (капи)',
        'Ретейнери',
      ]
    },
    {
      category: 'Естетична стоматологія',
      description: 'Покращення зовнішнього вигляду зубів',
      services: [
        'Відбілювання зубів',
        'Художня реставрація',
        'Композитні вінири',
        'Керамічні вінири',
        'Реконтурінг ясен',
        'Естетичні пломби',
      ]
    },
    {
      category: 'Дитяча стоматологія',
      description: 'Спеціалізована допомога для маленьких пацієнтів',
      services: [
        'Профілактичні огляди',
        'Лікування молочних зубів',
        'Фторування зубів',
        'Герметизація фісур',
        'Пластинки для дітей',
        'Навчання гігієні',
      ]
    }
  ]

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Наші послуги
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Повний спектр стоматологічних послуг для всієї родини. 
            Ми використовуємо найсучасніші технології та матеріали для досягнення 
            найкращих результатів лікування.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((category, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {category.category}
                </h2>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
              
              <ul className="space-y-3">
                {category.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-dental-teal mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <button className="text-dental-teal hover:text-teal-600 font-medium">
                  Дізнатися більше про ціни →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-20 bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Що входить в кожну послугу
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ми забезпечуємо комплексний підхід до лікування з урахуванням індивідуальних потреб пацієнта
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-dental-teal/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Безкоштовна консультація
              </h3>
              <p className="text-gray-600">
                Детальний огляд та план лікування без додаткових платежів
              </p>
            </div>

            <div className="text-center">
              <div className="bg-dental-teal/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Гарантія якості
              </h3>
              <p className="text-gray-600">
                Гарантія на всі види робіт згідно з медичними стандартами
              </p>
            </div>

            <div className="text-center">
              <div className="bg-dental-teal/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Післялікувальний контроль
              </h3>
              <p className="text-gray-600">
                Регулярні контрольні огляди для забезпечення тривалого результату
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-dental-blue rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Потрібна консультація?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Наші лікарі проведуть детальний огляд та розроблять індивідуальний план лікування, 
              який підходить саме вам
            </p>
            <button className="bg-white text-dental-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Записатися на консультацію
            </button>
          </div>
        </div>
      </div>
      {/* FAQ Section */}
      <div className="mt-20">
        <FAQAccordion categories={ALL_FAQS} />
      </div>
    </div>
  )
}

export default Services
