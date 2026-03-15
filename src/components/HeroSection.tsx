'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Play, Shield, Award, Users, Star, Phone } from 'lucide-react'

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return { count, ref }
}

// Floating element with parallax effect
function FloatingElement({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <div 
      className={`animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export default function HeroSection() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { count: patientsCount, ref: patientsRef } = useCounter(5000, 2500)
  const { count: satisfactionCount, ref: satisfactionRef } = useCounter(98, 2000)
  const { count: yearsCount, ref: yearsRef } = useCounter(10, 1500)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-dental-secondary-50 via-white to-dental-primary-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-dental-primary-200/40 to-dental-primary-100/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-dental-secondary-200/40 to-dental-secondary-100/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-dental-primary-100/30 to-transparent rounded-full blur-3xl"
        />

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Text content */}
          <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 bg-dental-primary-50 border border-dental-primary-200 px-4 py-2 rounded-full mb-8 transition-all duration-700"
              style={{ transitionDelay: '200ms' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dental-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dental-primary-500"></span>
              </span>
              <span className="text-sm font-medium text-dental-primary-700">{t('stats.workingNow')}</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dental-dark leading-[1.1] mb-6 tracking-tight text-balance" suppressHydrationWarning>
              {t('home.hero.title')}
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-dental-text leading-relaxed mb-10 max-w-lg" suppressHydrationWarning>
              {t('home.hero.description')}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center gap-3 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-dental-primary-600/20 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {t('hero.bookConsultation')}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-dental-primary-50 text-dental-primary-700 px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-dental-secondary-300 transition-all duration-300 hover:border-dental-primary-400"
              >
                <Play className="h-5 w-5" />
                {t('hero.ourServices')}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-dental-muted">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-dental-primary-500" />
                <span>{t('stats.qualityGuarantee')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-dental-primary-500" />
                <span>{t('features.experiencedDoctors.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-dental-primary-500" />
                <span>{t('features.modernEquipment.title')}</span>
              </div>
            </div>
          </div>

          {/* Right column - Stats grid with 2x2 layout */}
          <div className={`transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-2 gap-4">
              {/* Patients */}
              <div 
                ref={patientsRef}
                className="bg-white rounded-2xl p-5 shadow-md border border-dental-secondary-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-dental-primary-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dental-dark">{patientsCount.toLocaleString()}+</p>
                <p className="text-dental-muted text-sm">Пацієнтів</p>
              </div>

              {/* Satisfaction */}
              <div 
                ref={satisfactionRef}
                className="bg-white rounded-2xl p-5 shadow-md border border-dental-secondary-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-dental-primary-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dental-dark">{satisfactionCount}%</p>
                <p className="text-dental-muted text-sm">Задоволених</p>
              </div>

              {/* Experience */}
              <div 
                ref={yearsRef}
                className="bg-white rounded-2xl p-5 shadow-md border border-dental-secondary-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-dental-primary-50 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-dental-primary-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-dental-dark">{yearsCount}+</p>
                <p className="text-dental-muted text-sm">Років досвіду</p>
              </div>

              {/* Free consultation */}
              <Link
                href="/booking"
                className="bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-lg font-bold text-white">Безкоштовно</p>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  Консультація
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Logos/Trust bar */}
        <div 
          className={`mt-20 pt-12 border-t border-dental-secondary-200 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-center text-sm text-dental-muted mb-6">Нам довіряють пацієнти по всій Україні</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-dental-muted">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">ISO 9001</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              <span className="font-semibold">Ліцензована клініка</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              <span className="font-semibold">4.9 Google</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <span className="font-semibold">Сімейна стоматологія</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}
