'use client'

import Link from 'next/link'
import { Smile, Shield, Users, Award, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LazyImage from '@/components/ui/LazyImage'
import HeroSection from '@/components/HeroSection'
import AnimatedCard, { AnimatedSection } from '@/components/ui/AnimatedCard'
import {
  useScrollAnimation,
  useStaggeredAnimation,
} from '@/hooks/useScrollAnimation'
import BeforeAfterGallery from '@/components/BeforeAfterGallery'
import images from '@/content/images.json'

// Type for service images from images.json
interface ServiceImage {
  src: string
  fallback?: string
  alt: string
  title: string
  category: string
  width: number
  height: number
}

// Type for the images JSON structure
interface ImagesData {
  services?: ServiceImage[]
  [key: string]: unknown
}

const typedImages = images as ImagesData

interface HomeProps {
  heroCTAVariant?: string | null
}

const Home = ({ heroCTAVariant }: HomeProps) => {
  const { t } = useTranslation()

  // Scroll animation hooks for page sections
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation()
  const { ref: servicesRef, isVisible: servicesVisible } =
    useStaggeredAnimation({ staggerDelay: 150 })
  const { ref: pricingRef, isVisible: pricingVisible } = useScrollAnimation()
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation()

  const features = [
    {
      icon: <Smile className="h-14 w-14 text-dental-teal" />,
      title: t('features.comfortableTreatment.title'),
      description: t('features.comfortableTreatment.description'),
    },
    {
      icon: <Shield className="h-14 w-14 text-dental-teal" />,
      title: t('features.safetySterility.title'),
      description: t('features.safetySterility.description'),
    },
    {
      icon: <Users className="h-14 w-14 text-dental-teal" />,
      title: t('features.experiencedDoctors.title'),
      description: t('features.experiencedDoctors.description'),
    },
    {
      icon: <Award className="h-14 w-14 text-dental-teal" />,
      title: t('features.modernEquipment.title'),
      description: t('features.modernEquipment.description'),
    },
  ]

  const services = [
    {
      title: t('services.categories.therapeutic'),
      description: t('home.services.cards.therapeuticDescription'),
    },
    {
      title: t('services.categories.surgical'),
      description: t('home.services.cards.surgicalDescription'),
    },
    {
      title: t('services.categories.orthopedic'),
      description: t('home.services.cards.orthopedicDescription'),
    },
    {
      title: t('services.categories.orthodontics'),
      description: t('home.services.cards.orthodonticsDescription'),
    },
  ]

  const basicExamFeatures = t('pricing.basicExam.features', {
    returnObjects: true,
  }) as unknown
  const professionalHygieneFeatures = t(
    'pricing.professionalHygiene.features',
    {
      returnObjects: true,
    }
  ) as unknown
  const comprehensiveDiagnosticsFeatures = t(
    'pricing.comprehensiveDiagnostics.features',
    { returnObjects: true }
  ) as unknown

  return (
    <div>
      {/* Modern Animated Hero Section */}
      <HeroSection heroCTAVariant={heroCTAVariant} />

      {/* Features Section */}
      <section
        ref={featuresRef}
        role="region"
        aria-labelledby="features-heading"
        className="py-24 bg-dental-secondary-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={featuresVisible}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-dental-primary-600 tracking-wider uppercase mb-4">
              {t('home.features.title')}
            </span>
            <h2
              id="features-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6 leading-tight"
            >
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('home.features.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard
                key={index}
                hoverEffect="lift"
                delay={index * 100}
                isVisible={featuresVisible}
                className="text-center p-8 border border-dental-secondary-200"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-dental-primary-50 rounded-2xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-dental-dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-dental-muted leading-relaxed">
                  {feature.description}
                </p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        ref={servicesRef}
        role="region"
        aria-labelledby="services-heading"
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={servicesVisible}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-dental-primary-600 tracking-wider uppercase mb-4">
              {t('navigation.services')}
            </span>
            <h2
              id="services-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6 leading-tight"
            >
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('home.services.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const svc = typedImages.services?.[index]
              const bg =
                svc?.src || '/assets/images/services/dental-cleaning.jpg'
              return (
                <AnimatedCard
                  key={index}
                  hoverEffect="glow"
                  delay={index * 150}
                  isVisible={servicesVisible}
                  className="overflow-hidden border border-dental-secondary-200 group"
                >
                  <div className="h-56 relative overflow-hidden">
                    <LazyImage
                      src={svc?.src || bg}
                      fallback={svc?.fallback}
                      alt={
                        svc?.alt ||
                        t('home.services.imageAlt', { title: service.title })
                      }
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      width={1200}
                      height={800}
                    />
                    <div className="absolute inset-0 bg-slate-900/40" />
                    <div className="absolute bottom-4 left-6 right-6">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {service.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-dental-muted mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <Link
                      href="/services"
                      className="inline-flex items-center text-dental-primary-600 hover:text-dental-primary-700 font-semibold group/link"
                    >
                      {t('buttons.learnMore')}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </AnimatedCard>
              )
            })}
          </div>

          <AnimatedSection
            isVisible={servicesVisible}
            delay={600}
            className="text-center mt-12"
          >
            <Link
              href="/services"
              className="inline-flex items-center gap-3 bg-dental-primary-900 hover:bg-dental-primary-800 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-dental-primary-900/20 hover:-translate-y-0.5"
            >
              {t('buttons.allServices')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Before/After Gallery Section */}
      <BeforeAfterGallery />

      {/* Pricing Section */}
      <section
        ref={pricingRef}
        role="region"
        aria-labelledby="pricing-heading"
        className="py-24 bg-dental-secondary-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={pricingVisible}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-dental-primary-600 tracking-wider uppercase mb-4">
              {t('pricing.title')}
            </span>
            <h2
              id="pricing-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6 leading-tight"
            >
              {t('home.pricing.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('pricing.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-200 p-8 relative hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-dental-dark mb-2">
                  {t('pricing.basicExam.title')}
                </h3>
                <div className="text-4xl font-bold text-dental-primary-700 mb-6">
                  {t('pricing.basicExam.price')}
                </div>
                <ul className="space-y-3 text-dental-muted mb-8">
                  {(Array.isArray(basicExamFeatures)
                    ? (basicExamFeatures as string[])
                    : []
                  ).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-secondary-100 hover:bg-dental-secondary-200 text-dental-dark px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </div>

            {/* Professional Package */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-dental-primary-600 p-8 relative sm:transform sm:scale-105 hover:shadow-xl transition-all">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-dental-primary-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {t('pricing.professionalHygiene.popular')}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-dental-dark mb-2">
                  {t('pricing.professionalHygiene.title')}
                </h3>
                <div className="text-4xl font-bold text-dental-primary-700 mb-6">
                  {t('pricing.professionalHygiene.price')}
                </div>
                <ul className="space-y-3 text-dental-muted mb-8">
                  {(Array.isArray(professionalHygieneFeatures)
                    ? (professionalHygieneFeatures as string[])
                    : []
                  ).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-primary-700 hover:bg-dental-primary-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </div>

            {/* Premium Package */}
            <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-200 p-8 relative hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-dental-dark mb-2">
                  {t('pricing.comprehensiveDiagnostics.title')}
                </h3>
                <div className="text-4xl font-bold text-dental-primary-700 mb-6">
                  {t('pricing.comprehensiveDiagnostics.price')}
                </div>
                <ul className="space-y-3 text-dental-muted mb-8">
                  {(Array.isArray(comprehensiveDiagnosticsFeatures)
                    ? (comprehensiveDiagnosticsFeatures as string[])
                    : []
                  ).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-secondary-100 hover:bg-dental-secondary-200 text-dental-dark px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-dental-muted mb-4">{t('pricing.disclaimer')}</p>
            <Link
              href="/services"
              className="text-dental-primary-700 hover:text-dental-primary-600 font-semibold inline-flex items-center"
            >
              {t('pricing.viewAllPrices')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        role="region"
        aria-labelledby="cta-heading"
        className="py-24 bg-dental-primary-900 text-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-dental-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-dental-primary-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection isVisible={ctaVisible} animation="fadeUp">
            <h2
              id="cta-heading"
              className="text-4xl lg:text-5xl font-bold mb-6 leading-tight"
            >
              {t('home.cta.title')}
            </h2>
            <p className="text-xl text-dental-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('home.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-dental-dark px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5"
              >
                {t('buttons.bookAppointment')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 bg-transparent hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-white/30 transition-all duration-300"
              >
                {t('buttons.sendRequest')}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}

export default Home
