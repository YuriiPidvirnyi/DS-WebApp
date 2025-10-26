import { Check, HeartPulse, Syringe, Sparkles, Baby, Smile, Zap, Crown } from 'lucide-react'
import FAQAccordion from '@/components/FAQAccordion'
import { ALL_FAQS } from '@/content/faqs'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

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
      <Helmet>
        <title>Послуги — Dental Story</title>
        <meta name="description" content="Терапевтична, хірургічна, ортопедична стоматологія, ортодонтія, естетика та дитяча стоматологія." />
        <link rel="canonical" href="https://dentalstory.com.ua/services" />
      </Helmet>
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
          {services.map((category, index) => {
            const getIcon = () => {
              switch (category.category) {
                case 'Терапевтична стоматологія':
                  return <HeartPulse className="h-8 w-8 text-dental-teal" />
                case 'Хірургічна стоматологія':
                  return <Syringe className="h-8 w-8 text-red-500" />
                case 'Ортопедична стоматологія':
                  return <Crown className="h-8 w-8 text-yellow-500" />
                case 'Ортодонтія':
                  return <Smile className="h-8 w-8 text-blue-500" />
                case 'Естетична стоматологія':
                  return <Sparkles className="h-8 w-8 text-pink-500" />
                case 'Дитяча стоматологія':
                  return <Baby className="h-8 w-8 text-green-500" />
                default:
                  return <Zap className="h-8 w-8 text-dental-teal" />
              }
            }
            
            const getBgColor = () => {
              switch (category.category) {
                case 'Терапевтична стоматологія':
                  return 'bg-gradient-to-br from-dental-teal/5 to-dental-teal/10 border-dental-teal/20'
                case 'Хірургічна стоматологія':
                  return 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                case 'Ортопедична стоматологія':
                  return 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200'
                case 'Ортодонтія':
                  return 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
                case 'Естетична стоматологія':
                  return 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200'
                case 'Дитяча стоматологія':
                  return 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
                default:
                  return 'bg-white border-gray-200'
              }
            }
            
            return (
            <div key={index} className={`rounded-2xl shadow-sm border-2 p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${getBgColor()}`}>
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    {getIcon()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category.category}
                    </h2>
                    <p className="text-gray-600 text-lg">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-4">
                {category.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="flex items-start group">
                    <div className="bg-dental-teal/10 p-1 rounded-full mr-4 mt-0.5">
                      <Check className="h-4 w-4 text-dental-teal" />
                    </div>
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">{service}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button className="w-full bg-white/80 hover:bg-white text-gray-800 py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200">
                  Дізнатися більше про ціни →
                </button>
              </div>
            </div>
          )
          })}
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
          <div className="bg-teal-800 rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Потрібна консультація?
            </h2>
            <p className="text-white mb-8 max-w-2xl mx-auto">
              Наші лікарі проведуть детальний огляд та розроблять індивідуальний план лікування, 
              який підходить саме вам
            </p>
<Link to="/booking" className="inline-block bg-white text-teal-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Записатися на консультацію
            </Link>
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
