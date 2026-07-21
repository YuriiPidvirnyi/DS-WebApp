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
import { useSectionSnap } from '@/hooks/useSectionSnap'
import BeforeAfterGallery from '@/components/BeforeAfterGallery'
import images from '@/content/images.json'
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardMedia,
} from '@/components/ui'

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
  useSectionSnap()

  // Scroll animation hooks for page sections
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation()
  const { ref: servicesRef, isVisible: servicesVisible } =
    useStaggeredAnimation({ staggerDelay: 150 })
  const { ref: pricingRef, isVisible: pricingVisible } = useScrollAnimation()

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
        className="snap-start snap-screen flex flex-col justify-center py-12 bg-dental-secondary-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={featuresVisible}
            className="text-center mb-10"
          >
            {/* Кікер не дублює H2 (знахідка 06) */}
            <span className="inline-block text-sm font-semibold text-dental-primary-ink tracking-wider uppercase mb-4">
              {t('home.features.kicker')}
            </span>
            <h2
              id="features-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-4 leading-tight"
            >
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('home.features.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard
                key={index}
                variant="outlined"
                hoverEffect="lift"
                delay={index * 100}
                isVisible={featuresVisible}
                className="text-center p-8"
              >
                <CardHeader className="mb-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-dental-primary-50 rounded-2xl flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardTitle as="h3" className="text-xl font-bold mb-3">
                  {feature.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
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
        className="snap-start snap-screen flex flex-col justify-center py-12 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={servicesVisible}
            className="text-center mb-10"
          >
            <span className="inline-block text-sm font-semibold text-dental-primary-ink tracking-wider uppercase mb-4">
              {t('navigation.services')}
            </span>
            <h2
              id="services-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-4 leading-tight"
            >
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('home.services.subtitle')}
            </p>
          </AnimatedSection>

          {/* Один ряд на lg: 2×2 великих плиток давало секції 1589px — майже
              дві висоти екрана; чотири компактні картки вміщають секцію в
              один снап-екран. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const svc = typedImages.services?.[index]
              const bg =
                svc?.src || '/assets/images/services/dental-cleaning.jpg'
              return (
                <AnimatedCard
                  key={index}
                  variant="outlined"
                  hoverEffect="glow"
                  delay={index * 150}
                  isVisible={servicesVisible}
                  className="overflow-hidden group"
                >
                  {/* Реальне фото категорії (object-cover — кадри не 16:9);
                      фолбек — брендований SVG-тайл. Заголовок у тілі картки —
                      не білим по фото, що ламало правило WCAG для Brand Blue
                      і вимагало темних оверлеїв. */}
                  <CardMedia aspectRatio="video" className="relative">
                    <LazyImage
                      src={svc?.src || bg}
                      fallback={svc?.fallback}
                      alt={
                        svc?.alt ||
                        t('home.services.imageAlt', { title: service.title })
                      }
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={svc?.width ?? 800}
                      height={svc?.height ?? 450}
                      // Фото тепер великі (до 1500px) — без sizes next/image
                      // добирав би srcset від intrinsic-ширини, а не від
                      // фактичної чверті ряду.
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </CardMedia>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-dental-dark mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-dental-muted mb-3 leading-relaxed">
                      {service.description}
                    </p>
                    <CardFooter className="mt-2 pt-3">
                      <Link
                        href="/services"
                        className="inline-flex items-center text-dental-primary-ink hover:text-dental-primary-700 font-semibold group/link"
                      >
                        {t('buttons.learnMore')}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </CardFooter>
                  </div>
                </AnimatedCard>
              )
            })}
          </div>

          <AnimatedSection
            isVisible={servicesVisible}
            delay={600}
            className="text-center mt-10"
          >
            <Link
              href="/services"
              className="inline-flex items-center gap-3 bg-dental-primary-900 hover:bg-dental-primary-800 text-white px-8 py-4 rounded-lg font-heading font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-dental-primary-900/20 hover:-translate-y-0.5"
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
        className="snap-start snap-screen flex flex-col justify-center py-12 bg-dental-secondary-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection
            isVisible={pricingVisible}
            className="text-center mb-10"
          >
            <span className="inline-block text-sm font-semibold text-dental-primary-ink tracking-wider uppercase mb-4">
              {t('pricing.title')}
            </span>
            <h2
              id="pricing-heading"
              className="text-4xl lg:text-5xl font-bold text-dental-dark mb-4 leading-tight"
            >
              {t('home.pricing.title')}
            </h2>
            <p className="text-xl text-dental-muted max-w-3xl mx-auto leading-relaxed">
              {t('pricing.subtitle')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <AnimatedCard
              variant="outlined"
              hoverEffect="lift"
              delay={0}
              isVisible={pricingVisible}
              className="p-8 relative"
            >
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
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3 shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-secondary-100 hover:bg-dental-secondary-200 text-dental-dark px-6 py-3 rounded font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </AnimatedCard>

            {/* Professional Package — popular, scale up at sm+ */}
            <AnimatedCard
              variant="selected"
              hoverEffect="lift"
              delay={100}
              isVisible={pricingVisible}
              className="p-8 relative sm:scale-105"
            >
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
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3 shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-primary-700 hover:bg-dental-primary-800 text-white px-6 py-3 rounded font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </AnimatedCard>

            {/* Premium Package */}
            <AnimatedCard
              variant="outlined"
              hoverEffect="lift"
              delay={200}
              isVisible={pricingVisible}
              className="p-8 relative"
            >
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
                      <span className="w-2 h-2 bg-dental-teal rounded-full mr-3 shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className="block w-full bg-dental-secondary-100 hover:bg-dental-secondary-200 text-dental-dark px-6 py-3 rounded font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                >
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </AnimatedCard>
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
    </div>
  )
}

export default Home
