'use client'

import {
  Check,
  HeartPulse,
  Syringe,
  Sparkles,
  Baby,
  Smile,
  Zap,
  Crown,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import FAQAccordion from '@/components/FAQAccordion'
import PriceCalculator from '@/components/PriceCalculator'
import SmartRecommendations from '@/components/SmartRecommendations'
import { getAllFaqs } from '@/content/faqs'

const Services = () => {
  const { t } = useTranslation()
  const serviceFaqs = getAllFaqs(t)

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

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('navigation.services')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('services.subtitle')}
          </p>
          {/* AI Service Finder */}
          <SmartRecommendations />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((category, index) => {
            const getIcon = () => {
              switch (index) {
                case 0:
                  return <HeartPulse className="h-8 w-8 text-dental-primary" />
                case 1:
                  return <Syringe className="h-8 w-8 text-dental-error" />
                case 2:
                  return <Crown className="h-8 w-8 text-dental-warning" />
                case 3:
                  return <Smile className="h-8 w-8 text-dental-info" />
                case 4:
                  return <Sparkles className="h-8 w-8 text-dental-primary" />
                case 5:
                  return <Baby className="h-8 w-8 text-dental-success" />
                default:
                  return <Zap className="h-8 w-8 text-dental-primary" />
              }
            }

            const getBgColor = () => {
              switch (index) {
                case 0:
                  return 'bg-gradient-to-br from-dental-primary-50 to-dental-primary-100 border-dental-primary-200'
                case 1:
                  return 'bg-gradient-to-br from-dental-error-light to-dental-error-light/50 border-dental-error-light'
                case 2:
                  return 'bg-gradient-to-br from-dental-warning-light to-dental-warning-light/50 border-dental-warning-light'
                case 3:
                  return 'bg-gradient-to-br from-dental-info-light to-dental-info-light/50 border-dental-info-light'
                case 4:
                  return 'bg-gradient-to-br from-dental-primary-50 to-dental-primary-100 border-dental-primary-200'
                case 5:
                  return 'bg-gradient-to-br from-dental-success-light to-dental-success-light/50 border-dental-success-light'
                default:
                  return 'bg-white border-dental-secondary-200'
              }
            }

            return (
              <div
                key={index}
                className={`rounded-2xl shadow-sm border-2 p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${getBgColor()}`}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      {getIcon()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dental-dark">
                        {category.category}
                      </h2>
                      <p className="text-dental-muted text-lg">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-4">
                  {category.services.map((service, serviceIndex) => (
                    <li key={serviceIndex} className="flex items-start group">
                      <div className="bg-dental-primary-100 p-1 rounded-full mr-4 mt-0.5">
                        <Check className="h-4 w-4 text-dental-primary" />
                      </div>
                      <span className="text-dental-text group-hover:text-dental-dark transition-colors font-medium">
                        {service}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-6 border-t border-dental-secondary-200">
                  <Link
                    href="/booking"
                    className="block w-full bg-white/80 hover:bg-white text-dental-dark py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md border border-dental-secondary-200 text-center"
                  >
                    {t('buttons.learnMore')} →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Features */}
        <div className="mt-20 bg-dental-primary-50 rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dental-dark mb-4">
              {t('services.features.title')}
            </h2>
            <p className="text-dental-muted max-w-2xl mx-auto">
              {t('services.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-dental-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-primary" />
              </div>
              <h3 className="text-xl font-semibold text-dental-dark mb-2">
                {t('services.features.consultation.title')}
              </h3>
              <p className="text-dental-muted">
                {t('services.features.consultation.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-dental-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-primary" />
              </div>
              <h3 className="text-xl font-semibold text-dental-dark mb-2">
                {t('services.features.quality.title')}
              </h3>
              <p className="text-dental-muted">
                {t('services.features.quality.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-dental-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-dental-primary" />
              </div>
              <h3 className="text-xl font-semibold text-dental-dark mb-2">
                {t('services.features.followUp.title')}
              </h3>
              <p className="text-dental-muted">
                {t('services.features.followUp.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Price Calculator */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-dental-dark mb-4">
              {t('services.calculator.title')}
            </h2>
            <p className="text-lg text-dental-muted max-w-2xl mx-auto">
              {t('services.calculator.subtitle')}
            </p>
          </div>
          <PriceCalculator />
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-dental-primary-700 rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              {t('services.cta.title')}
            </h2>
            <p className="text-white mb-8 max-w-2xl mx-auto">
              {t('services.cta.description')}
            </p>
            <Link
              href="/booking"
              className="inline-block bg-white text-dental-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-dental-primary-50 transition-colors"
            >
              {t('buttons.bookConsultation')}
            </Link>
          </div>
        </div>
      </div>
      {/* FAQ Section */}
      <div className="mt-20">
        <FAQAccordion categories={serviceFaqs} />
      </div>
    </div>
  )
}

export default Services
