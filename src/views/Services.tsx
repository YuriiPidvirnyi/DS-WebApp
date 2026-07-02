'use client'

import {
  HeartPulse,
  Syringe,
  Sparkles,
  Baby,
  Smile,
  Crown,
  Stethoscope,
  Award,
  CalendarCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import FAQAccordion from '@/components/FAQAccordion'
import PriceCalculator from '@/components/PriceCalculator'
import SmartRecommendations from '@/components/SmartRecommendations'
import AnimatedCard, { AnimatedSection } from '@/components/ui/AnimatedCard'
import {
  useScrollAnimation,
  useStaggeredAnimation,
} from '@/hooks/useScrollAnimation'
import { getAllFaqs } from '@/content/faqs'

const CATEGORY_ICONS = [HeartPulse, Syringe, Crown, Smile, Sparkles, Baby]

const FEATURE_ICONS = [Stethoscope, Award, CalendarCheck]

const Services = () => {
  const { t } = useTranslation()
  const serviceFaqs = getAllFaqs(t)

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()
  const { ref: gridRef, isVisible: gridVisible } = useStaggeredAnimation({
    staggerDelay: 100,
  })
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation()
  const { ref: calcRef, isVisible: calcVisible } = useScrollAnimation()
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation()

  const services = [
    {
      category: t('services.categories.therapeutic'),
      description: t('services.descriptions.therapeutic'),
      services: [
        t('services.list.therapeutic.caries'),
        t('services.list.therapeutic.endodontic'),
        t('services.list.therapeutic.pulpitis'),
        t('services.list.therapeutic.periodontitis'),
        t('services.list.therapeutic.hygiene'),
        t('services.list.therapeutic.restoration'),
      ],
    },
    {
      category: t('services.categories.surgical'),
      description: t('services.descriptions.surgical'),
      services: [
        t('services.list.surgical.extraction'),
        t('services.list.surgical.wisdomTeeth'),
        t('services.list.surgical.implantation'),
        t('services.list.surgical.sinusLift'),
        t('services.list.surgical.bonePlastics'),
        t('services.list.surgical.periodontalTreatment'),
      ],
    },
    {
      category: t('services.categories.orthopedic'),
      description: t('services.descriptions.orthopedic'),
      services: [
        t('services.list.orthopedic.metalCeramicCrowns'),
        t('services.list.orthopedic.metalFreeCrowns'),
        t('services.list.orthopedic.bridges'),
        t('services.list.orthopedic.removableDentures'),
        t('services.list.orthopedic.veneers'),
        t('services.list.orthopedic.lumineers'),
      ],
    },
    {
      category: t('services.categories.orthodontics'),
      description: t('services.descriptions.orthodontics'),
      services: [
        t('services.list.orthodontics.metalBraces'),
        t('services.list.orthodontics.ceramicBraces'),
        t('services.list.orthodontics.sapphireBraces'),
        t('services.list.orthodontics.lingualBraces'),
        t('services.list.orthodontics.aligners'),
        t('services.list.orthodontics.retainers'),
      ],
    },
    {
      category: t('services.categories.aesthetic'),
      description: t('services.descriptions.aesthetic'),
      services: [
        t('services.list.aesthetic.whitening'),
        t('services.list.aesthetic.artisticRestoration'),
        t('services.list.aesthetic.compositeVeneers'),
        t('services.list.aesthetic.ceramicVeneers'),
        t('services.list.aesthetic.gumContouring'),
        t('services.list.aesthetic.aestheticFillings'),
      ],
    },
    {
      category: t('services.categories.pediatric'),
      description: t('services.descriptions.pediatric'),
      services: [
        t('services.list.pediatric.preventiveCheckups'),
        t('services.list.pediatric.milkTeeth'),
        t('services.list.pediatric.fluoridation'),
        t('services.list.pediatric.fissureSealing'),
        t('services.list.pediatric.plates'),
        t('services.list.pediatric.hygieneTraining'),
      ],
    },
  ]

  const featureKeys = ['consultation', 'quality', 'followUp'] as const

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <AnimatedSection isVisible={headerVisible}>
            <h1 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6">
              {t('navigation.services')}
            </h1>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto mb-8">
              {t('services.subtitle')}
            </p>
            <SmartRecommendations />
          </AnimatedSection>
        </div>

        {/* Services Grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((category, index) => {
            const Icon = CATEGORY_ICONS[index]
            return (
              <AnimatedCard
                key={index}
                hoverEffect="lift"
                delay={index * 100}
                isVisible={gridVisible}
                className="border border-dental-secondary-200 p-8"
              >
                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-2">
                    <div className="bg-dental-primary-50 p-3 rounded-2xl shrink-0">
                      <Icon className="h-7 w-7 text-dental-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-dental-dark leading-snug">
                        {category.category}
                      </h2>
                      <p className="text-dental-muted text-sm mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3">
                  {category.services.map((service, serviceIndex) => (
                    <li key={serviceIndex} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-dental-primary-600 shrink-0" />
                      <span className="text-dental-text text-sm font-medium">
                        {service}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-5 border-t border-dental-secondary-100">
                  <Link
                    href="/booking"
                    className="text-sm font-semibold text-dental-primary-600 hover:text-dental-primary-700 transition-colors"
                  >
                    {t('buttons.learnMore')} →
                  </Link>
                </div>
              </AnimatedCard>
            )
          })}
        </div>

        {/* Key service landing links */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-dental-dark mb-3">
              {t('services.landingLinks.title')}
            </h2>
            <p className="text-dental-muted max-w-2xl mx-auto">
              {t('services.landingLinks.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['implantation', 'aligners', 'veneers', 'sedation'] as const).map(
              slug => (
                <Link
                  key={slug}
                  href={`/services/${slug}`}
                  className="group p-6 rounded-2xl border border-dental-secondary-200 bg-white hover:bg-dental-primary-50 hover:border-dental-primary-300 transition-all duration-300"
                >
                  <span className="block text-xs font-semibold text-dental-primary-700 uppercase tracking-wide mb-2">
                    {t(`serviceLanding.${slug}.badge`)}
                  </span>
                  <span className="block text-lg font-bold text-dental-dark mb-3">
                    {t(`serviceLanding.${slug}.title`)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-dental-primary-600 group-hover:text-dental-primary-700 transition-colors">
                    {t('buttons.learnMore')}
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </Link>
              )
            )}
          </div>
        </div>

        {/* Features */}
        <div
          ref={featuresRef}
          className="mt-20 bg-dental-secondary-50 rounded-2xl p-8 lg:p-12"
        >
          <AnimatedSection
            isVisible={featuresVisible}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-dental-dark mb-3">
              {t('services.features.title')}
            </h2>
            <p className="text-dental-muted max-w-2xl mx-auto">
              {t('services.features.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureKeys.map((key, index) => {
              const FeatureIcon = FEATURE_ICONS[index]
              return (
                <AnimatedCard
                  key={key}
                  hoverEffect="none"
                  delay={index * 150}
                  isVisible={featuresVisible}
                  className="bg-white border border-dental-secondary-100 p-6 text-center"
                >
                  <div className="bg-dental-primary-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FeatureIcon className="h-7 w-7 text-dental-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-dental-dark mb-2">
                    {t(`services.features.${key}.title`)}
                  </h3>
                  <p className="text-dental-muted text-sm leading-relaxed">
                    {t(`services.features.${key}.description`)}
                  </p>
                </AnimatedCard>
              )
            })}
          </div>
        </div>

        {/* Price Calculator */}
        <div ref={calcRef} className="mt-20">
          <AnimatedSection isVisible={calcVisible} className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-dental-dark mb-4">
              {t('services.calculator.title')}
            </h2>
            <p className="text-lg text-dental-muted max-w-2xl mx-auto">
              {t('services.calculator.subtitle')}
            </p>
          </AnimatedSection>
          <PriceCalculator />
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="mt-16 text-center">
          <AnimatedSection isVisible={ctaVisible}>
            <div className="bg-dental-dark rounded-2xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('services.cta.title')}
              </h2>
              <p className="text-dental-primary-200 mb-8 max-w-2xl mx-auto">
                {t('services.cta.description')}
              </p>
              <Link
                href="/booking"
                className="inline-block bg-white text-dental-dark px-8 py-3 rounded-lg font-semibold hover:bg-dental-primary-50 transition-colors"
              >
                {t('buttons.bookConsultation')}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <FAQAccordion categories={serviceFaqs} />
      </div>
    </div>
  )
}

export default Services
