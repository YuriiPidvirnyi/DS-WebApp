'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Phone, CheckCircle2 } from 'lucide-react'

export default function HeroSection() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const benefits = [
    { text: 'Безкоштовна консультація', key: 'consultation' },
    { text: 'Сучасне обладнання', key: 'equipment' },
    { text: 'Досвідчені лікарі', key: 'doctors' },
  ]

  return (
    <section className="relative min-h-[85vh] flex items-center bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Gradient accent */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="container-custom relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content */}
          <div className={`space-y-6 sm:space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
                {t('stats.workingNow')}
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-foreground" suppressHydrationWarning>
                {t('home.hero.title')}
              </h1>
              <p className="text-responsive-base max-w-xl" suppressHydrationWarning>
                {t('home.hero.description')}
              </p>
            </div>

            {/* Benefits */}
            <ul className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-x-6 sm:gap-y-2">
              {benefits.map((benefit) => (
                <li key={benefit.key} className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>{benefit.text}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link
                href="/booking"
                className="btn-primary text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4"
                suppressHydrationWarning
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('hero.bookConsultation')}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href="/services"
                className="btn-secondary text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4"
                suppressHydrationWarning
              >
                {t('hero.ourServices')}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-4 sm:pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">5000+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Пацієнтів</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">10+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Років досвіду</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">4.9</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Google рейтинг</p>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className={`relative transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative aspect-[4/3] sm:aspect-square lg:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
              {/* Placeholder for clinic image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-6 sm:p-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-semibold text-foreground">Dental Story</p>
                    <p className="text-sm sm:text-base text-muted-foreground">Сучасна стоматологія</p>
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 bg-background/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-border">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">Безкоштовна консультація</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Для нових пацієнтів</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/10 rounded-2xl -z-10" aria-hidden="true" />
            <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-secondary rounded-xl -z-10" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
