'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Smile, Shield, Users, Award, ArrowRight } from 'lucide-react'
import LazyImage from '@/components/ui/LazyImage'
import images from '@/content/images.json'

// Dynamic imports for better code splitting - Testimonials is below the fold
const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => (
    <div className="py-20 bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
      </div>
    </div>
  ),
  ssr: true,
})

const Home = () => {
  const features = [
    {
      icon: <Smile className="h-14 w-14 text-dental-teal" />,
      title: 'Комфортне лікування',
      description: 'Сучасні методи знеболювання та комфортна атмосфера',
    },
    {
      icon: <Shield className="h-14 w-14 text-dental-teal" />,
      title: 'Безпека та стерильність',
      description: 'Дотримання найвищих стандартів гігієни та безпеки',
    },
    {
      icon: <Users className="h-14 w-14 text-dental-teal" />,
      title: 'Досвідчені лікарі',
      description:
        'Команда кваліфікованих стоматологів з багаторічним досвідом',
    },
    {
      icon: <Award className="h-14 w-14 text-dental-teal" />,
      title: 'Сучасне обладнання',
      description: 'Новітні технології для точної діагностики та лікування',
    },
  ]

  const services = [
    {
      title: 'Терапевтична стоматологія',
      description: 'Лікування карієсу, пульпіту, періодонтиту',
      image: '/api/placeholder/300/200',
    },
    {
      title: 'Хірургічна стоматологія',
      description: 'Видалення зубів, імплантація, пародонтологія',
      image: '/api/placeholder/300/200',
    },
    {
      title: 'Ортопедична стоматологія',
      description: 'Протезування, коронки, мости, вінири',
      image: '/api/placeholder/300/200',
    },
    {
      title: 'Ортодонтія',
      description: 'Виправлення прикусу, брекети, елайнери',
      image: '/api/placeholder/300/200',
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-dental-teal text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="mb-6">
                <span className="inline-block bg-dental-teal/20 text-dental-teal px-4 py-2 rounded-full text-sm font-semibold border border-dental-teal/30">
                  ✨ Сучасна стоматологія
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Ваша посмішка -
                <span className="bg-gradient-to-r from-dental-teal to-teal-300 bg-clip-text text-transparent">
                  наша місія
                </span>
              </h1>
              <p className="text-xl mb-8 text-gray-300 leading-relaxed max-w-2xl">
                Професійна стоматологічна допомога з використанням найсучасніших
                технологій та індивідуальним підходом до кожного пацієнта.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/booking"
                  className="bg-teal-800 hover:bg-teal-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center"
                  data-track-id="cta_hero_booking"
                  data-track-category="hero"
                  data-track-label="primary_cta"
                >
                  📞 Записатися на консультацію
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/services"
                  className="border-2 border-white text-white hover:bg-white hover:text-slate-800 px-8 py-4 rounded-xl font-semibold transition-all duration-200 text-center"
                >
                  Наші послуги
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Працюємо зараз
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Гарантія якості
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  10+ років досвіду
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🦷</div>
                  <h3 className="text-2xl font-bold mb-2">Dental Story</h3>
                  <p className="text-gray-300">
                    Сучасна стоматологічна клініка
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-dental-teal mr-3" />
                      <span>Пацієнтів обслужено</span>
                    </div>
                    <span className="font-bold text-dental-teal">5000+</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center">
                      <Smile className="h-5 w-5 text-dental-teal mr-3" />
                      <span>Відсоток задоволених</span>
                    </div>
                    <span className="font-bold text-dental-teal">98%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-dental-teal mr-3" />
                      <span>Досвід роботи</span>
                    </div>
                    <span className="font-bold text-dental-teal">
                      10+ років
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-dental-teal/20 to-teal-500/20 rounded-xl border border-dental-teal/30">
                  <p className="text-sm text-center font-medium">
                    💎 Безкоштовна консультація для нових пацієнтів
                  </p>
                </div>
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
              Ми поєднуємо професіоналізм, сучасні технології та індивідуальний
              підхід для досягнення найкращих результатів лікування
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
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
            {services.map((service, index) => {
              const svc = (images as any).services?.[index]
              const bg =
                svc?.src || '/assets/images/gallery/gallery-placeholder.svg'
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 relative">
                    <LazyImage
                      src={svc?.src || bg}
                      fallback={svc?.fallback}
                      alt={
                        svc?.alt || `${service.title} - стоматологічна послуга`
                      }
                      className="absolute inset-0"
                      width={1200}
                      height={800}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/40" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <Link
                      href="/services"
                      className="text-dental-teal hover:text-teal-600 font-medium inline-flex items-center"
                    >
                      Дізнатися більше
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/services"
              className="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              Всі послуги
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Прозорі ціни
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Без прихованих доплат. Всі ціни фіксовані та узгоджуються перед
              початком лікування
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Базовий огляд
                </h3>
                <div className="text-4xl font-bold text-teal-800 mb-6">
                  Безкоштовно
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Консультація лікаря
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Огляд ротової порожнини
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    План лікування
                  </li>
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Записатися
                </Link>
              </div>
            </div>

            {/* Professional Package */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-dental-teal p-8 relative transform scale-105 hover:shadow-xl transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-teal-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Популярний
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Професійна гігієна
                </h3>
                <div className="text-4xl font-bold text-teal-800 mb-6">
                  від 800₴
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Ультразвукове чищення
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Полірування зубів
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Фторування
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Рекомендації по догляду
                  </li>
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-teal-800 hover:bg-teal-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Записатися
                </Link>
              </div>
            </div>

            {/* Premium Package */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Комплексна діагностика
                </h3>
                <div className="text-4xl font-bold text-teal-800 mb-6">
                  від 1200₴
                </div>
                <ul className="space-y-3 text-gray-600 mb-8">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    3D знімок щелеп
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Детальна консультація
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    План лікування
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                    Знижка 10% на лікування
                  </li>
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Записатися
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              *Остаточна вартість залежить від складності випадку та обраного
              методу лікування
            </p>
            <Link
              href="/services"
              className="text-dental-teal hover:text-teal-600 font-semibold inline-flex items-center"
            >
              Переглянути всі ціни
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Готові до красивої посмішки?
          </h2>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
            Запишіться на безкоштовну консультацію та отримайте індивідуальний
            план лікування
          </p>
          <Link
            href="/contact"
            className="bg-white text-teal-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition-colors inline-flex items-center"
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
