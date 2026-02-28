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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-200/40 to-teal-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-slate-200/40 to-slate-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-teal-100/20 to-transparent rounded-full blur-3xl"
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
              className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-full mb-8 transition-all duration-700"
              style={{ transitionDelay: '200ms' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-sm font-medium text-teal-800">{t('stats.workingNow')}</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight text-balance">
              {t('home.hero.title')}
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              {t('home.hero.description')}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {t('hero.bookConsultation')}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-slate-200 transition-all duration-300 hover:border-slate-300"
              >
                <Play className="h-5 w-5" />
                {t('hero.ourServices')}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                <span>{t('stats.qualityGuarantee')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-600" />
                <span>{t('features.experiencedDoctors.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-teal-600" />
                <span>{t('features.modernEquipment.title')}</span>
              </div>
            </div>
          </div>

          {/* Right column - Stats cards with floating animation */}
          <div className={`relative transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Main stats card */}
            <div className="relative">
              {/* Floating decorative elements */}
              <FloatingElement delay={0} className="absolute -top-6 -left-6 z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              </FloatingElement>

              <FloatingElement delay={0.5} className="absolute -bottom-4 -right-4 z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg flex items-center justify-center">
                  <span className="text-xl">🦷</span>
                </div>
              </FloatingElement>

              <FloatingElement delay={1} className="absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                </div>
              </FloatingElement>

              {/* Stats card */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl mb-4">
                    <span className="text-4xl">🏥</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Dental Story</h3>
                  <p className="text-slate-500 mt-1">Сучасна стоматологічна клініка</p>
                </div>

                <div className="space-y-6">
                  {/* Stats items */}
                  <div 
                    ref={patientsRef}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl transition-all duration-300 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="text-slate-600 font-medium">{t('stats.patientsServed')}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{patientsCount.toLocaleString()}+</span>
                  </div>

                  <div 
                    ref={satisfactionRef}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl transition-all duration-300 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Star className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="text-slate-600 font-medium">{t('stats.satisfactionRate')}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{satisfactionCount}%</span>
                  </div>

                  <div 
                    ref={yearsRef}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl transition-all duration-300 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Award className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="text-slate-600 font-medium">{t('stats.yearsExperience')}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{yearsCount}+</span>
                  </div>
                </div>

                {/* Special offer */}
                <div className="mt-8 p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl text-white text-center">
                  <p className="font-semibold">{t('stats.freeConsultation')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logos/Trust bar */}
        <div 
          className={`mt-20 pt-12 border-t border-slate-200 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-center text-sm text-slate-500 mb-6">Нам довіряють пацієнти по всій Україні</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400">
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
