'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Star, CheckCircle, Calendar } from 'lucide-react'
import { UKRAINE_CONFIG, SITE_INFO } from '@/utils/constants'
import { CLINIC_OPENING_HOURS } from '@/config/clinicSchedule'
import {
  trackEvent,
  BookingEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'
import { memo } from 'react'

function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Trigger immediately if already in viewport (e.g. hero stats visible on load)
    const rect = el.getBoundingClientRect()
    if (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      !hasAnimated.current
    ) {
      hasAnimated.current = true
      setIsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    let raf: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [isVisible, end, duration])

  return { count, ref }
}

interface HeroSectionProps {
  heroCTAVariant?: string | null
}

function HeroSection({ heroCTAVariant }: HeroSectionProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { count: patientsCount, ref: patientsRef } = useCounter(5000, 2500)
  const { count: yearsCount, ref: yearsRef } = useCounter(6, 1500)

  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => {
      setNow(new Date())
      const interval = setInterval(() => setNow(new Date()), 60_000)
      return () => clearInterval(interval)
    }, msUntilNextMinute)
    return () => clearTimeout(timeout)
  }, [])

  const { isClinicOpen, nextOpenTime } = useMemo(() => {
    if (!now) return { isClinicOpen: false, nextOpenTime: null }
    const kyiv = new Date(
      now.toLocaleString('en-US', { timeZone: UKRAINE_CONFIG.timezone })
    )
    const day = kyiv.getDay()
    const hours = kyiv.getHours()
    const minutes = kyiv.getMinutes()
    const time = hours * 60 + minutes

    const open =
      day === 0
        ? false
        : day === 6
          ? time >= 540 && time < 1080
          : time >= 540 && time < 1260

    let next: string | null = null
    if (!open) {
      if (day === 6 && time < 540) next = CLINIC_OPENING_HOURS.saturday.open
      else next = CLINIC_OPENING_HOURS.weekday.open
    }

    return { isClinicOpen: open, nextOpenTime: next }
  }, [now])

  return (
    /*
      Макет 1a: герой в один екран — текст + фото на підкладці чистого
      бренд-кольору #AECED3 (Б2, 05); один головний CTA (07); перевірна
      статистика замість абстрактної (17).
    */
    <section
      className="snap-start snap-screen relative flex flex-col justify-center overflow-hidden bg-white"
      suppressHydrationWarning
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none bg-dental-primary-50"
        suppressHydrationWarning
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          {/* Main headline with badge */}
          <div
            className="transition-all duration-700"
            style={{
              transform: mounted ? 'translateY(0)' : 'translateY(1.5rem)',
            }}
          >
            {/* Open / Closed badge */}
            <div className="inline-block mb-6">
              {mounted && (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                    isClinicOpen
                      ? 'bg-dental-success-light border-dental-success/30'
                      : 'bg-dental-secondary-50 border-dental-secondary-300'
                  }`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isClinicOpen
                        ? 'bg-dental-success animate-pulse'
                        : 'bg-dental-muted'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      isClinicOpen
                        ? 'text-dental-success-dark'
                        : 'text-dental-muted'
                    }`}
                  >
                    {isClinicOpen
                      ? t('stats.workingNow')
                      : t('stats.closedNow')}
                    {!isClinicOpen && nextOpenTime && (
                      <span className="font-normal ml-1">
                        {'· '}
                        {t('stats.opensAt', { time: nextOpenTime })}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </div>

            {/* Large headline */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-dental-dark leading-[1.06] mb-6 text-balance tracking-tight"
              suppressHydrationWarning
            >
              {t('home.hero.title')}
            </h1>

            {/* Description text */}
            <p
              className="text-lg md:text-xl text-dental-text leading-relaxed mb-9 max-w-lg font-light"
              suppressHydrationWarning
            >
              {t('home.hero.description')}
            </p>

            {/* Один головний CTA + текстовий вторинний (знахідка 07) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
              <Link
                href="/booking"
                onClick={() =>
                  trackEvent(
                    BookingEvent.BookingStart,
                    AnalyticsEventCategory.Booking,
                    {
                      source: 'hero',
                      ab_test_id: 'hero-cta',
                      ab_variant: heroCTAVariant ?? 'control',
                    }
                  )
                }
                className="group inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-dental-primary-600/30 hover:-translate-y-0.5"
              >
                <Calendar className="h-5 w-5" />
                {heroCTAVariant === 'variant-b'
                  ? t('hero.bookConsultationB')
                  : heroCTAVariant === 'variant-c'
                    ? t('hero.bookConsultationC')
                    : t('hero.bookConsultation')}
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center gap-1.5 px-2 py-4 font-semibold text-dental-primary-700 hover:text-dental-primary-600 transition-colors"
              >
                {t('hero.ourServices')}
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Компактна стрічка статистики (знахідка 17: перевірна цифра) */}
            <div className="mt-8 pt-7 border-t border-dental-primary-100 flex flex-wrap items-center gap-x-9 gap-y-4">
              <div ref={patientsRef}>
                <p className="font-heading text-3xl font-extrabold text-dental-dark">
                  {patientsCount.toLocaleString()}+
                </p>
                <p className="text-sm text-dental-muted mt-0.5">
                  {t('stats.patients')}
                </p>
              </div>
              <div
                className="hidden sm:block w-px h-10 bg-dental-primary-100"
                aria-hidden="true"
              />
              <div>
                <p className="font-heading text-3xl font-extrabold text-dental-dark inline-flex items-center gap-1.5">
                  {SITE_INFO.rating}
                  <Star
                    className="h-4.5 w-4.5 text-dental-primary-500 fill-dental-primary-500"
                    aria-hidden="true"
                  />
                </p>
                <p className="text-sm text-dental-muted mt-0.5">
                  {t('stats.googleReviews', { count: SITE_INFO.reviewCount })}
                </p>
              </div>
              <div
                className="hidden sm:block w-px h-10 bg-dental-primary-100"
                aria-hidden="true"
              />
              <div ref={yearsRef}>
                <p className="font-heading text-3xl font-extrabold text-dental-dark">
                  {yearsCount}+
                </p>
                <p className="text-sm text-dental-muted mt-0.5">
                  {t('stats.yearsExperience')}
                </p>
              </div>
            </div>
          </div>

          {/* Фото на підкладці чистого бренд-кольору (Б2, 05) */}
          <div
            className="relative transition-all duration-700 delay-150"
            style={{
              transform: mounted ? 'translateY(0)' : 'translateY(1.5rem)',
            }}
          >
            <div className="relative h-72 sm:h-96 lg:h-[560px] rounded-xl bg-dental-primary overflow-hidden">
              <Image
                src="/assets/images/brand/happy-patient.jpg"
                alt={t('home.hero.photoAlt')}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            {/* Плаваюча картка «Безкоштовна консультація» */}
            <Link
              href="/booking"
              className="absolute -bottom-4 left-4 sm:left-0 lg:-left-8 flex items-center gap-3.5 bg-white rounded-md shadow-soft-lg px-5 py-4 hover:shadow-soft-xl transition-shadow"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dental-success-light">
                <CheckCircle
                  className="h-5.5 w-5.5 text-dental-success-dark"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block font-semibold text-dental-dark">
                  {t('stats.freeConsultationShort')}
                </span>
                <span className="block text-sm text-dental-muted">
                  {t('stats.forNewPatients')}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo<HeroSectionProps>(HeroSection)
