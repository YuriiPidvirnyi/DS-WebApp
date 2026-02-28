'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Award, Users, Clock, Heart, ArrowRight, Check, GraduationCap } from 'lucide-react'
import { SITE_INFO } from '@/utils/constants'

const stats = [
  { number: '5+', label: 'Років досвіду' },
  { number: '5000+', label: 'Задоволених пацієнтів' },
  { number: '10+', label: 'Спеціалістів' },
  { number: '98%', label: 'Рекомендують нас' },
]

const team = [
  {
    name: 'Др. Олена Іванова',
    position: 'Головний лікар',
    specialty: 'Стоматолог-терапевт',
    experience: '15 років досвіду',
    education: 'НМУ ім. Богомольця',
  },
  {
    name: 'Др. Микола Петренко',
    position: 'Стоматолог-хірург',
    specialty: 'Імплантолог',
    experience: '12 років досвіду',
    education: 'УМСА, Полтава',
  },
  {
    name: 'Др. Марія Коваленко',
    position: 'Стоматолог-ортодонт',
    specialty: 'Брекети та елайнери',
    experience: '8 років досвіду',
    education: 'НМУ ім. Богомольця',
  },
]

const values = [
  {
    icon: Heart,
    title: 'Турбота',
    description: 'Індивідуальний підхід та комфорт кожного пацієнта',
  },
  {
    icon: Award,
    title: 'Якість',
    description: 'Використовуємо тільки сертифіковані матеріали',
  },
  {
    icon: Users,
    title: 'Команда',
    description: 'Злагоджена робота досвідчених спеціалістів',
  },
  {
    icon: Clock,
    title: 'Пунктуальність',
    description: 'Поважаємо ваш час - прийоми без затримок',
  },
]

const equipment = [
  'Цифрова рентген-діагностика',
  '3D-томографія (КЛКТ)',
  'Лазерна стоматологія',
  'CAD/CAM система протезування',
  'Ультразвукове чищення',
  'Мікроскоп для ендодонтії',
]

const About = () => {
  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">
            Про клініку
          </span>
          <h1 className="mb-4">
            {SITE_INFO.name} — {SITE_INFO.tagline}
          </h1>
          <p className="text-responsive-base max-w-3xl mx-auto">
            Сучасна стоматологічна клініка у центрі Львова, яка поєднує
            професіоналізм, інноваційні технології та індивідуальний підхід.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 lg:mb-24">
          {stats.map((stat, i) => (
            <div key={i} className="card-elevated p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Story + Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
          <div className="space-y-6">
            <h2>Наша історія</h2>
            <p className="text-muted-foreground leading-relaxed">
              Клініка Dental Story відкрила свої двері у 2020 році з метою надання
              якісної стоматологічної допомоги мешканцям Львова. За роки роботи 
              ми допомогли тисячам пацієнтів відновити здоров'я зубів та 
              отримати красиву посмішку.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Наша команда об'єднує досвідчених лікарів, які постійно підвищують 
              кваліфікацію та слідкують за новітніми тенденціями в стоматології. 
              Ми використовуємо тільки сертифіковане обладнання та матеріали 
              від провідних світових виробників.
            </p>
            <Link href="/services" className="btn-primary inline-flex">
              Наші послуги
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/hero-dental.jpg"
              alt="Інтер'єр клініки Dental Story"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Values */}
        <div className="mb-16 lg:mb-24">
          <div className="text-center mb-10">
            <h2 className="mb-3">Наші цінності</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Принципи, якими ми керуємося в щоденній роботі
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="card-elevated p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16 lg:mb-24">
          <div className="text-center mb-10">
            <h2 className="mb-3">Наша команда</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Досвідчені лікарі з вищою медичною освітою
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((doctor) => (
              <div key={doctor.name} className="card-elevated p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-primary font-medium text-sm mb-1">
                    {doctor.position}
                  </p>
                  <p className="text-muted-foreground text-sm mb-3">
                    {doctor.specialty}
                  </p>
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {doctor.experience}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {doctor.education}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-muted rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="mb-4">Сучасне обладнання</h2>
              <p className="text-muted-foreground mb-6">
                Використовуємо передові технології для точної діагностики 
                та ефективного лікування.
              </p>
              <ul className="space-y-3">
                {equipment.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/hero-dental.jpg"
                alt="Сучасне стоматологічне обладнання"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 lg:mt-24 text-center">
          <div className="bg-foreground rounded-3xl p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-background mb-4">
              Готові познайомитися?
            </h2>
            <p className="text-background/70 mb-8 max-w-2xl mx-auto">
              Запишіться на безкоштовну консультацію та переконайтеся в якості 
              наших послуг особисто
            </p>
            <Link
              href="/booking"
              className="btn-primary bg-background text-foreground hover:bg-background/90"
            >
              Записатися на прийом
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
