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
    <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(94, 156, 160, 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(94, 156, 160, 0.05) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Top section: Headlines & CTA */}
        <div className="max-w-5xl mx-auto mb-20">
          {/* Main headline with badge */}
          <div 
            className="transition-all duration-1000"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(3rem)' }}
          >
            {/* Small badge */}
            <div className="inline-block mb-6">
              <span className="inline-flex items-center gap-2 bg-dental-primary-50 px-3 py-1 rounded-full border border-dental-primary-200">
                <span className="inline-block w-1.5 h-1.5 bg-dental-primary-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-dental-primary-700">{t('stats.workingNow')}</span>
              </span>
            </div>

            {/* Large headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dental-dark leading-[1.05] mb-8 text-balance tracking-tight" suppressHydrationWarning>
              {t('home.hero.title')}
            </h1>

            {/* Description text */}
            <p className="text-lg md:text-xl text-dental-text leading-relaxed mb-10 max-w-2xl font-light" suppressHydrationWarning>
              {t('home.hero.description')}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-dental-primary-600/30 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {t('hero.bookConsultation')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 bg-transparent hover:bg-dental-primary-50 text-dental-primary-700 px-8 py-3.5 rounded-full font-semibold border-2 border-dental-primary-300 transition-all duration-300 hover:border-dental-primary-600"
              >
                <Play className="h-5 w-5" />
                {t('hero.ourServices')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats section - Enhanced design */}
        <div 
          className="transition-all duration-1000 delay-300"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(3rem)' }}
        >
          {/* Stats grid - responsive layout */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Stat 1: Patients */}
            <div 
              ref={patientsRef}
              className="group p-6 lg:p-8 rounded-3xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300 cursor-default"
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dental-primary-100 group-hover:bg-dental-primary-200 transition-colors">
                  <Users className="h-7 w-7 text-dental-primary-600" />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-4xl lg:text-5xl font-bold text-dental-dark">{patientsCount.toLocaleString()}+</p>
              </div>
              <p className="text-dental-muted text-base font-medium">Пацієнтів</p>
            </div>

            {/* Stat 2: Satisfaction */}
            <div 
              ref={satisfactionRef}
              className="group p-6 lg:p-8 rounded-3xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300 cursor-default"
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dental-primary-100 group-hover:bg-dental-primary-200 transition-colors">
                  <Star className="h-7 w-7 text-dental-primary-600 fill-dental-primary-600" />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-4xl lg:text-5xl font-bold text-dental-dark">{satisfactionCount}%</p>
              </div>
              <p className="text-dental-muted text-base font-medium">Задоволених</p>
            </div>

            {/* Stat 3: Experience */}
            <div 
              ref={yearsRef}
              className="group p-6 lg:p-8 rounded-3xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300 cursor-default"
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dental-primary-100 group-hover:bg-dental-primary-200 transition-colors">
                  <Award className="h-7 w-7 text-dental-primary-600" />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-4xl lg:text-5xl font-bold text-dental-dark">{yearsCount}+</p>
              </div>
              <p className="text-dental-muted text-base font-medium">Років досвіду</p>
            </div>

            {/* CTA Card - Highlighted */}
            <Link
              href="/booking"
              className="group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-dental-primary-500 to-dental-primary-600 hover:from-dental-primary-600 hover:to-dental-primary-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                    <Phone className="h-7 w-7 text-white" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-white mb-1">Безкоштовна</p>
                <p className="text-white/90 text-base font-medium flex items-center gap-2">
                  консультація
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          </div>

          {/* Trust indicators - Compact */}
          <div 
            className="flex flex-wrap justify-center items-center gap-8 pt-4 border-t border-dental-secondary-100 transition-all duration-1000 delay-500"
            style={{ opacity: mounted ? 1 : 0 }}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">Гарантія якості</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">Досвідчені лікарі</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">Сучасне обладнання</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
