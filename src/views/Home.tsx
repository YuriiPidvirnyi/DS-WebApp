'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Smile, Shield, Users, Award, ArrowRight, Sparkles, Phone } from 'lucide-react'
import HeroSection from '@/components/HeroSection'

const features = [
  {
    icon: Smile,
    title: 'Комфортне лікування',
    description: 'Сучасні методи знеболювання та затишна атмосфера',
  },
  {
    icon: Shield,
    title: 'Безпека та стерильність',
    description: 'Найвищі стандарти гігієни та безпеки пацієнтів',
  },
  {
    icon: Users,
    title: 'Досвідчені лікарі',
    description: 'Команда кваліфікованих спеціалістів з досвідом 10+ років',
  },
  {
    icon: Award,
    title: 'Сучасне обладнання',
    description: 'Новітні технології для точної діагностики',
  },
]

const services = [
  {
    title: 'Терапевтична стоматологія',
    description: 'Лікування карієсу, пульпіту, періодонтиту',
    price: 'від 600₴',
  },
  {
    title: 'Хірургічна стоматологія',
    description: 'Видалення зубів, імплантація, пародонтологія',
    price: 'від 800₴',
  },
  {
    title: 'Ортопедична стоматологія',
    description: 'Протезування, коронки, мости, вінири',
    price: 'від 2500₴',
  },
  {
    title: 'Ортодонтія',
    description: 'Виправлення прикусу, брекети, елайнери',
    price: 'від 15000₴',
  },
  {
    title: 'Професійна гігієна',
    description: 'Ультразвукове чищення, полірування, фторування',
    price: 'від 800₴',
  },
  {
    title: 'Естетична стоматологія',
    description: 'Відбілювання, вінири, реставрація',
    price: 'від 1200₴',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-3">
              Наші переваги
            </span>
            <h2 className="mb-4">Чому пацієнти обирають нас</h2>
            <p className="text-responsive-base max-w-2xl mx-auto">
              Поєднуємо професіоналізм, сучасні технології та індивідуальний підхід
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card-elevated p-6 text-center group hover:border-primary/20"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-3">
              Послуги
            </span>
            <h2 className="mb-4">Повний спектр стоматологічних послуг</h2>
            <p className="text-responsive-base max-w-2xl mx-auto">
              Від профілактики до складних операцій - все для здоров'я вашої посмішки
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="card-elevated p-6 group hover:border-primary/20"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="font-semibold text-primary">{service.price}</span>
                  <Link
                    href="/services"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    Детальніше
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="btn-primary">
              Всі послуги та ціни
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="section-padding bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Новинка
              </div>
              <h2>AI-асистент для перевірки симптомів</h2>
              <p className="text-responsive-base">
                Опишіть свої симптоми нашому AI-асистенту і отримайте попередню оцінку 
                стану та рекомендації щодо візиту до лікаря. Працює 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/symptom-checker" className="btn-primary">
                  <Sparkles className="h-5 w-5" />
                  Перевірити симптоми
                </Link>
                <Link href="/about" className="btn-secondary">
                  Дізнатися більше
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto lg:max-w-none relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
                <div className="absolute inset-4 bg-card rounded-2xl shadow-xl border border-border p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Dental AI</p>
                        <p className="text-xs text-muted-foreground">Онлайн</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-muted rounded-xl p-3 max-w-[80%]">
                        <p className="text-sm text-muted-foreground">
                          Привіт! Я AI-асистент Dental Story. Опишіть, що вас турбує.
                        </p>
                      </div>
                      <div className="bg-primary rounded-xl p-3 max-w-[80%] ml-auto">
                        <p className="text-sm text-primary-foreground">
                          Болить зуб при жуванні...
                        </p>
                      </div>
                      <div className="bg-muted rounded-xl p-3 max-w-[80%]">
                        <p className="text-sm text-muted-foreground">
                          Це може бути ознакою карієсу або тріщини емалі. Рекомендую 
                          записатися на огляд найближчим часом.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-3">
              Ціни
            </span>
            <h2 className="mb-4">Прозоре ціноутворення</h2>
            <p className="text-responsive-base max-w-2xl mx-auto">
              Без прихованих доплат. Всі ціни узгоджуються перед початком лікування
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Basic */}
            <div className="card-elevated p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Базовий огляд</h3>
              <div className="text-3xl font-bold text-primary mb-4">Безкоштовно</div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>Консультація лікаря</li>
                <li>Огляд ротової порожнини</li>
                <li>План лікування</li>
              </ul>
              <Link href="/booking" className="btn-secondary w-full justify-center">
                Записатися
              </Link>
            </div>

            {/* Popular */}
            <div className="card-elevated p-6 text-center border-2 border-primary relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                Популярний
              </span>
              <h3 className="text-xl font-semibold text-foreground mb-2">Професійна гігієна</h3>
              <div className="text-3xl font-bold text-primary mb-4">від 800₴</div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>Ультразвукове чищення</li>
                <li>Полірування зубів</li>
                <li>Фторування</li>
                <li>Рекомендації по догляду</li>
              </ul>
              <Link href="/booking" className="btn-primary w-full justify-center">
                Записатися
              </Link>
            </div>

            {/* Premium */}
            <div className="card-elevated p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Комплексна діагностика</h3>
              <div className="text-3xl font-bold text-primary mb-4">від 1200₴</div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>3D знімок щелеп</li>
                <li>Детальна консультація</li>
                <li>План лікування</li>
                <li>Знижка 10% на лікування</li>
              </ul>
              <Link href="/booking" className="btn-secondary w-full justify-center">
                Записатися
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-custom text-center">
          <h2 className="text-background mb-4">Готові до красивої посмішки?</h2>
          <p className="text-background/70 text-responsive-base max-w-2xl mx-auto mb-8">
            Запишіться на безкоштовну консультацію та отримайте індивідуальний план лікування
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 sm:px-8 py-3.5 rounded-xl font-medium hover:bg-background/90 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Записатися на прийом
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-background/30 text-background px-6 sm:px-8 py-3.5 rounded-xl font-medium hover:bg-background/10 transition-colors"
            >
              Зв'язатися з нами
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
