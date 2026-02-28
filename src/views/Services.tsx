'use client'

import { Check, HeartPulse, Syringe, Sparkles, Baby, Smile, Crown, ArrowRight, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import FAQAccordion from '@/components/FAQAccordion'
import PriceCalculator from '@/components/PriceCalculator'
import SmartRecommendations from '@/components/SmartRecommendations'
import { ALL_FAQS } from '@/content/faqs'

const services = [
  {
    category: 'Терапевтична стоматологія',
    description: 'Лікування та профілактика захворювань зубів',
    icon: HeartPulse,
    color: 'text-primary',
    bgColor: 'bg-primary/5 border-primary/10',
    services: [
      'Лікування карієсу',
      'Ендодонтичне лікування',
      'Лікування пульпіту',
      'Лікування періодонтиту',
      'Професійна гігієна',
      'Реставрація зубів',
    ],
  },
  {
    category: 'Хірургічна стоматологія',
    description: 'Хірургічні втручання в порожнині рота',
    icon: Syringe,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 border-rose-100',
    services: [
      'Видалення зубів',
      'Видалення зубів мудрості',
      'Імплантація зубів',
      'Синус-ліфтинг',
      'Кісткова пластика',
      'Лікування пародонтиту',
    ],
  },
  {
    category: 'Ортопедична стоматологія',
    description: 'Відновлення зубів та їх функцій',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 border-amber-100',
    services: [
      'Металокерамічні коронки',
      'Безметалеві коронки',
      'Мостоподібні протези',
      'Знімні протези',
      'Вінири',
      'Люмінири',
    ],
  },
  {
    category: 'Ортодонтія',
    description: 'Виправлення прикусу та положення зубів',
    icon: Smile,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-100',
    services: [
      'Металеві брекети',
      'Керамічні брекети',
      'Сапфірові брекети',
      'Лінгвальні брекети',
      'Елайнери (капи)',
      'Ретейнери',
    ],
  },
  {
    category: 'Естетична стоматологія',
    description: 'Покращення зовнішнього вигляду зубів',
    icon: Sparkles,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 border-pink-100',
    services: [
      'Відбілювання зубів',
      'Художня реставрація',
      'Композитні вінири',
      'Керамічні вінири',
      'Реконтурінг ясен',
      'Естетичні пломби',
    ],
  },
  {
    category: 'Дитяча стоматологія',
    description: 'Спеціалізована допомога для маленьких пацієнтів',
    icon: Baby,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border-emerald-100',
    services: [
      'Профілактичні огляди',
      'Лікування молочних зубів',
      'Фторування зубів',
      'Герметизація фісур',
      'Пластинки для дітей',
      'Навчання гігієні',
    ],
  },
]

const features = [
  {
    icon: Check,
    title: 'Безкоштовна консультація',
    description: 'Детальний огляд та план лікування без додаткових платежів',
  },
  {
    icon: Shield,
    title: 'Гарантія якості',
    description: 'Гарантія на всі види робіт згідно з медичними стандартами',
  },
  {
    icon: Clock,
    title: 'Післялікувальний контроль',
    description: 'Регулярні контрольні огляди для тривалого результату',
  },
]

const Services = () => {
  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">
            Повний спектр послуг
          </span>
          <h1 className="mb-4">Наші послуги</h1>
          <p className="text-responsive-base max-w-3xl mx-auto mb-8">
            Сучасні стоматологічні послуги для всієї родини. Використовуємо 
            найновіші технології та матеріали для досягнення найкращих результатів.
          </p>
          {/* AI Service Finder */}
          <SmartRecommendations />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.category}
                className={`card-elevated border ${service.bgColor} p-6 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">
                      {service.category}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {service.services.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/booking"
                  className="btn-secondary w-full justify-center text-sm py-2.5"
                >
                  Записатися
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Features */}
        <div className="mt-16 lg:mt-24 bg-muted rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Що входить в кожну послугу
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Комплексний підхід до лікування з урахуванням індивідуальних потреб
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Price Calculator */}
        <div className="mt-16 lg:mt-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Розрахуйте вартість
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Приблизний розрахунок вартості послуг
            </p>
          </div>
          <PriceCalculator />
        </div>

        {/* CTA */}
        <div className="mt-16 lg:mt-24">
          <div className="bg-foreground rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-background mb-4">
              Потрібна консультація?
            </h2>
            <p className="text-background/70 mb-8 max-w-2xl mx-auto">
              Наші лікарі проведуть детальний огляд та розроблять індивідуальний
              план лікування, який підходить саме вам
            </p>
            <Link
              href="/booking"
              className="btn-primary bg-background text-foreground hover:bg-background/90"
            >
              Записатися на консультацію
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 lg:mt-24">
          <FAQAccordion categories={ALL_FAQS} />
        </div>
      </div>
    </div>
  )
}

export default Services
