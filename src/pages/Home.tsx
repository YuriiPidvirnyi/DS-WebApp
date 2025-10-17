import { Link } from 'react-router-dom'
import { Smile, Shield, Users, Award, ArrowRight } from 'lucide-react'
import Testimonials from '@/components/Testimonials'

const Home = () => {
  const features = [
    {
      icon: <Smile className="h-12 w-12 text-dental-teal" />,
      title: 'Комфортне лікування',
      description: 'Сучасні методи знеболювання та комфортна атмосфера'
    },
    {
      icon: <Shield className="h-12 w-12 text-dental-teal" />,
      title: 'Безпека та стерильність',
      description: 'Дотримання найвищих стандартів гігієни та безпеки'
    },
    {
      icon: <Users className="h-12 w-12 text-dental-teal" />,
      title: 'Досвідчені лікарі',
      description: 'Команда кваліфікованих стоматологів з багаторічним досвідом'
    },
    {
      icon: <Award className="h-12 w-12 text-dental-teal" />,
      title: 'Сучасне обладнання',
      description: 'Новітні технології для точної діагностики та лікування'
    }
  ]

  const services = [
    {
      title: 'Терапевтична стоматологія',
      description: 'Лікування карієсу, пульпіту, періодонтиту',
      image: '/api/placeholder/300/200'
    },
    {
      title: 'Хірургічна стоматологія',
      description: 'Видалення зубів, імплантація, пародонтологія',
      image: '/api/placeholder/300/200'
    },
    {
      title: 'Ортопедична стоматологія',
      description: 'Протезування, коронки, мости, вінири',
      image: '/api/placeholder/300/200'
    },
    {
      title: 'Ортодонтія',
      description: 'Виправлення прикусу, брекети, елайнери',
      image: '/api/placeholder/300/200'
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-dental-blue to-dental-teal text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Ваша посмішка - 
                <span className="block text-yellow-300">наша місія</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Професійна стоматологічна допомога з використанням найсучасніших 
                технологій та індивідуальним підходом до кожного пацієнта.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contact"
                  className="bg-white text-dental-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                >
                  Записатися на консультацію
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/services"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-dental-blue transition-colors text-center"
                >
                  Наші послуги
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-4">Чому обирають нас?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
                    Безболісне лікування
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
                    Гарантія на всі послуги
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
                    Сучасне обладнання
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
                    Кваліфіковані лікарі
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Чому пацієнти обирають Dental Story
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ми поєднуємо професіоналізм, сучасні технології та індивідуальний підхід 
              для досягнення найкращих результатів лікування
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Наші послуги
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Повний спектр стоматологічних послуг для всієї родини
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-r from-dental-blue/20 to-dental-teal/20"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="text-dental-teal hover:text-teal-600 font-medium inline-flex items-center"
                  >
                    Дізнатися більше
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="bg-dental-teal hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              Всі послуги
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-dental-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Готові до красивої посмішки?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Запишіться на безкоштовну консультацію та отримайте індивідуальний план лікування
          </p>
          <Link
            to="/contact"
            className="bg-white text-dental-blue px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Записатися на прийом
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home