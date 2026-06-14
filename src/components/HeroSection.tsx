'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Play,
  Shield,
  Award,
  Users,
  Star,
  Phone,
} from 'lucide-react'
import { UKRAINE_CONFIG } from '@/utils/constants'
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

const StatCard = memo(function StatCard({
  counterRef,
  count,
  suffix,
  label,
  icon,
}: {
  counterRef: React.RefObject<HTMLDivElement | null>
  count: number
  suffix: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <div
      ref={counterRef}
      className="group p-5 sm:p-6 lg:p-8 rounded-3xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300 cursor-default"
    >
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dental-primary-100 group-hover:bg-dental-primary-200 transition-colors">
          {icon}
        </div>
      </div>
      <div className="mb-2">
        <p className="text-4xl lg:text-5xl font-bold text-dental-dark">
          {count.toLocaleString()}
          {suffix}
        </p>
      </div>
      <p className="text-dental-muted text-base font-medium">{label}</p>
    </div>
  )
})

interface HeroSectionProps {
  heroCTAVariant?: string | null
}

function HeroSection({ heroCTAVariant }: HeroSectionProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { count: patientsCount, ref: patientsRef } = useCounter(5000, 2500)
  const { count: satisfactionCount, ref: satisfactionRef } = useCounter(
    98,
    2000
  )
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
    <section
      className="relative min-h-[95vh] flex items-center overflow-hidden bg-white"
      suppressHydrationWarning
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none bg-dental-primary-50"
        suppressHydrationWarning
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Top section: Headlines & CTA */}
        <div className="max-w-5xl mx-auto mb-20">
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
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-dental-dark leading-[1.05] mb-8 text-balance tracking-tight"
              suppressHydrationWarning
            >
              {t('home.hero.title')}
            </h1>

            {/* Description text */}
            <p
              className="text-lg md:text-xl text-dental-text leading-relaxed mb-10 max-w-2xl font-light"
              suppressHydrationWarning
            >
              {t('home.hero.description')}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 min-w-0">
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
                className="group inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-dental-primary-600/30 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {heroCTAVariant === 'variant-b'
                  ? t('hero.bookConsultationB')
                  : heroCTAVariant === 'variant-c'
                    ? t('hero.bookConsultationC')
                    : t('hero.bookConsultation')}
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
          className="transition-all duration-700 delay-150"
          style={{
            transform: mounted ? 'translateY(0)' : 'translateY(1.5rem)',
          }}
        >
          {/* Stats grid - responsive layout */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard
              counterRef={patientsRef}
              count={patientsCount}
              suffix="+"
              label={t('stats.patients')}
              icon={<Users className="h-7 w-7 text-dental-primary-600" />}
            />
            <StatCard
              counterRef={satisfactionRef}
              count={satisfactionCount}
              suffix="%"
              label={t('stats.satisfiedPatients')}
              icon={
                <Star className="h-7 w-7 text-dental-primary-600 fill-dental-primary-600" />
              }
            />
            <StatCard
              counterRef={yearsRef}
              count={yearsCount}
              suffix="+"
              label={t('stats.yearsExperience')}
              icon={<Award className="h-7 w-7 text-dental-primary-600" />}
            />

            {/* CTA Card - Highlighted */}
            <Link
              href="/booking"
              className="group p-5 sm:p-6 lg:p-8 rounded-3xl bg-dental-primary-600 hover:bg-dental-primary-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                    <Phone className="h-7 w-7 text-white" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 leading-tight hyphens-auto wrap-anywhere">
                  {t('stats.freeConsultationShort')}
                </p>
                <p className="text-white/90 text-sm sm:text-base font-medium flex items-center gap-2 wrap-anywhere">
                  {t('stats.forNewPatients')}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          </div>

          {/* Trust indicators - Compact */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 pt-4 border-t border-dental-secondary-100 transition-all duration-700 delay-300">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">
                {t('stats.qualityGuarantee')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">
                {t('features.experiencedDoctors.title')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-dental-primary-500" />
              <span className="text-sm font-medium text-dental-text">
                {t('features.modernEquipment.title')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo<HeroSectionProps>(HeroSection)
