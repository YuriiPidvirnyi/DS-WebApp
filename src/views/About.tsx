'use client'

import { Award, Users, Clock, Heart } from 'lucide-react'
import images from '@/content/images.json'

const About = () => {
  const stats = [
    { number: '10+', label: 'Років досвіду' },
    { number: '5000+', label: 'Задоволених пацієнтів' },
    { number: '15+', label: 'Спеціалістів' },
    { number: '98%', label: 'Позитивних відгуків' },
  ]

  const team = [
    {
      name: 'Др. Олена Іванова',
      position: 'Головний лікар, стоматолог-терапевт',
      experience: '15 років досвіду',
      education: 'НМУ ім. Богомольця, спеціалізація в ендодонтії',
    },
    {
      name: 'Др. Микола Петренко',
      position: 'Стоматолог-хірург, імплантолог',
      experience: '12 років досвіду',
      education: 'УМСА, сертифікат по імплантології (Німеччина)',
    },
    {
      name: 'Др. Марія Коваленко',
      position: 'Стоматолог-ортодонт',
      experience: '8 років досвіду',
      education: 'НМУ ім. Богомольця, спеціалізація в ортодонтії',
    },
  ]

  // Map photos from images.json to team members by name
  type TeamPhoto = {
    title: string
    src?: string
    fallback?: string
    alt?: string
  }
  type EquipmentPhoto = {
    src?: string
    fallback?: string
    alt?: string
    title?: string
  }
  const data = images as unknown as {
    team?: TeamPhoto[]
    equipment?: EquipmentPhoto[]
  }
  const teamPhotos: Record<
    string,
    { src?: string; fallback?: string; alt?: string }
  > = {}
  data.team?.forEach(p => {
    teamPhotos[p.title] = { src: p.src, fallback: p.fallback, alt: p.alt }
  })

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-dental-teal" />,
      title: 'Турбота про пацієнтів',
      description:
        'Індивідуальний підхід та комфорт кожного пацієнта - наш пріоритет',
    },
    {
      icon: <Award className="h-8 w-8 text-dental-teal" />,
      title: 'Професіоналізм',
      description: 'Висококваліфіковані лікарі з багаторічним досвідом',
    },
    {
      icon: <Users className="h-8 w-8 text-dental-teal" />,
      title: 'Командна робота',
      description: 'Злагоджена команда спеціалістів для найкращих результатів',
    },
    {
      icon: <Clock className="h-8 w-8 text-dental-teal" />,
      title: 'Пунктуальність',
      description: 'Поважаємо ваш час - прийоми за розкладом без затримок',
    },
  ]

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Про нашу клініку
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dental Story - це сучасна стоматологічна клініка, яка поєднує
            професіоналізм, інноваційні технології та індивідуальний підхід до
            кожного пацієнта.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Наша історія</h2>
            <p className="text-gray-600 leading-relaxed">
              Клініка Dental Story була заснована в 2014 році з метою надання
              якісної стоматологічної допомоги з використанням найсучасніших
              технологій. Наша команда об'єднує досвідчених лікарів, які
              постійно підвищують свою кваліфікацію та слідкують за новітніми
              тенденціями в стоматології.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Ми пишаємося тим, що за роки роботи допомогли тисячам пацієнтів
              відновити здоров'я зубів та красиву посмішку. Наша філософія
              базується на принципах довіри, професіоналізму та індивідуального
              підходу до кожного пацієнта.
            </p>
          </div>
          <div className="bg-gradient-to-br from-dental-blue/10 to-dental-teal/10 rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🦷</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Dental Story
              </h3>
              <p className="text-gray-600">Ваша посмішка - наша місія</p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Наші цінності
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Принципи, якими ми керуємося в щоденній роботі та відносинах з
              пацієнтами
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Наша команда
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Досвідчені лікарі з вищою освітою та міжнародними сертифікатами
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {team.map((doctor, index) => {
              const photo = teamPhotos[doctor.name]
              const fallback =
                photo?.fallback ||
                '/assets/images/gallery/gallery-placeholder.svg'
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow"
                >
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden bg-dental-blue/20">
                    <img
                      src={photo?.src || fallback}
                      onError={e => {
                        const img = e.currentTarget as HTMLImageElement
                        if (img.src !== window.location.origin + fallback)
                          img.src = fallback
                      }}
                      alt={photo?.alt || doctor.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {doctor.name}
                  </h3>
                  <p className="text-teal-800 font-medium mb-2">
                    {doctor.position}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    {doctor.experience}
                  </p>
                  <p className="text-gray-500 text-sm">{doctor.education}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Сучасне обладнання
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    Цифрова рентген-діагностика
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">3D-томографія</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">Лазерна стоматологія</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    CAD/CAM система для протезування
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">Ультразвукове чищення</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                {data.equipment?.slice(0, 4).map((eq, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/2] overflow-hidden rounded-xl bg-white"
                  >
                    <img
                      src={
                        eq.src ||
                        '/assets/images/gallery/gallery-placeholder.svg'
                      }
                      onError={e => {
                        const img = e.currentTarget as HTMLImageElement
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = '1'
                          img.src =
                            eq.fallback ||
                            '/assets/images/gallery/gallery-placeholder.svg'
                        }
                      }}
                      alt={eq.alt || eq.title || 'Обладнання стоматології'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
