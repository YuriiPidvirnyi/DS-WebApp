'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Phone,
} from 'lucide-react'
import {
  trackEvent,
  BookingEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'

export type ServiceLandingSlug = 'implantation' | 'aligners' | 'veneers'

const ROUTE_META_KEY: Record<ServiceLandingSlug, string> = {
  implantation: 'serviceImplantation',
  aligners: 'serviceAligners',
  veneers: 'serviceVeneers',
}

const BENEFIT_KEYS = ['b1', 'b2', 'b3', 'b4'] as const
const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const
const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const

interface ServiceLandingProps {
  slug: ServiceLandingSlug
}

const ServiceLanding = ({ slug }: ServiceLandingProps) => {
  const { t } = useTranslation()
  const base = `serviceLanding.${slug}`

  const handleBookingClick = () =>
    trackEvent(BookingEvent.BookingStart, AnalyticsEventCategory.Booking, {
      source: `service-landing-${slug}`,
    })

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dental-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-14 lg:pb-20">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-dental-muted">
              <li>
                <Link
                  href="/"
                  className="hover:text-dental-primary-700 transition-colors"
                >
                  {t('navigation.home')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-dental-primary-700 transition-colors"
                >
                  {t('navigation.services')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-dental-text font-medium">
                {t(`routeMeta.${ROUTE_META_KEY[slug]}.breadcrumb`)}
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-white border border-dental-primary-200 text-xs font-semibold text-dental-primary-700 uppercase tracking-wide">
              {t(`${base}.badge`)}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dental-dark leading-[1.08] mb-6 text-balance tracking-tight">
              {t(`${base}.title`)}
            </h1>
            <p className="text-lg md:text-xl text-dental-text leading-relaxed mb-8 font-light">
              {t(`${base}.subtitle`)}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link
                href="/booking"
                onClick={handleBookingClick}
                className="group inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-dental-primary-600/30 hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5" />
                {t(`${base}.cta.button`)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-dental-text px-2 py-3.5">
                <CalendarClock className="h-5 w-5 text-dental-primary-500" />
                {t('stats.onlineBooking247')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <p className="max-w-3xl text-lg text-dental-text leading-relaxed">
          {t(`${base}.intro`)}
        </p>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 lg:pb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-dental-dark mb-10 tracking-tight">
          {t(`${base}.benefits.title`)}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFIT_KEYS.map(key => (
            <div
              key={key}
              className="p-6 rounded-3xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300"
            >
              <CheckCircle2 className="h-7 w-7 text-dental-primary-600 mb-4" />
              <h3 className="text-lg font-bold text-dental-dark mb-2">
                {t(`${base}.benefits.items.${key}.title`)}
              </h3>
              <p className="text-sm text-dental-text leading-relaxed">
                {t(`${base}.benefits.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-dental-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-dental-dark mb-10 tracking-tight">
            {t(`${base}.process.title`)}
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEP_KEYS.map((key, index) => (
              <li
                key={key}
                className="p-6 rounded-3xl bg-white border border-dental-secondary-200"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 mb-4 rounded-full bg-dental-primary-600 text-white font-bold">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-dental-dark mb-2">
                  {t(`${base}.process.steps.${key}.title`)}
                </h3>
                <p className="text-sm text-dental-text leading-relaxed">
                  {t(`${base}.process.steps.${key}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-dental-dark mb-10 tracking-tight">
          {t(`${base}.faq.title`)}
        </h2>
        <div className="space-y-3">
          {FAQ_KEYS.map(key => (
            <details
              key={key}
              className="group rounded-2xl border border-dental-secondary-200 bg-white open:border-dental-primary-300 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-4 font-semibold text-dental-dark">
                {t(`${base}.faq.items.${key}.question`)}
                <ChevronDown className="h-5 w-5 shrink-0 text-dental-primary-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-5 text-dental-text leading-relaxed">
                {t(`${base}.faq.items.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="rounded-3xl bg-dental-primary-600 px-8 py-12 lg:px-14 lg:py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {t(`${base}.cta.title`)}
          </h2>
          <p className="text-white/90 text-lg mb-8">
            {t(`${base}.cta.subtitle`)}
          </p>
          <Link
            href="/booking"
            onClick={handleBookingClick}
            className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-dental-primary-50 text-dental-primary-700 px-8 py-3.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {t(`${base}.cta.button`)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default ServiceLanding
