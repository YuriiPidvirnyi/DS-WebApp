'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

interface PrivacySection {
  id: string
  title: string
  paragraphs?: string[]
  list?: string[]
}

const PrivacyPolicy = () => {
  const { t } = useTranslation()
  const translatedSections = t('privacyPolicyPage.sections', {
    returnObjects: true,
  }) as unknown
  const sections = Array.isArray(translatedSections)
    ? (translatedSections as PrivacySection[])
    : []

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-dental-primary-700 hover:text-dental-primary-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('privacyPolicyPage.backHome')}
          </Link>
          <h1 className="text-4xl font-bold text-dental-dark mb-4">
            {t('privacyPolicyPage.title')}
          </h1>
          <p className="text-dental-muted">
            {t('privacyPolicyPage.lastUpdated')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {sections.map(section => (
            <section key={section.id} className="mb-8">
              <h2 className="text-2xl font-semibold text-dental-dark mb-4">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph, idx) => (
                <p
                  key={idx}
                  className={`text-dental-text leading-relaxed ${
                    idx + 1 === (section.paragraphs?.length || 0) &&
                    !section.list
                      ? ''
                      : 'mb-4'
                  }`}
                >
                  {paragraph}
                </p>
              ))}
              {section.list && section.list.length > 0 && (
                <ul className="list-disc pl-6 text-dental-text space-y-2">
                  {section.list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}

              {section.id === 'contact' && (
                <div className="bg-dental-secondary-50 p-6 rounded-lg mt-4">
                  <p className="text-dental-text mb-2">
                    <strong>
                      {t('privacyPolicyPage.contactCard.clinic', {
                        name: SITE_INFO.name,
                      })}
                    </strong>
                  </p>
                  <p className="text-dental-text mb-2">
                    {t('privacyPolicyPage.contactCard.addressLabel')}:{' '}
                    {CONTACT_INFO.address.fullWithPostal}
                  </p>
                  <p className="text-dental-text mb-2">
                    {t('privacyPolicyPage.contactCard.phoneLabel')}:{' '}
                    {CONTACT_INFO.phone}
                  </p>
                  <p className="text-dental-text">
                    {t('privacyPolicyPage.contactCard.emailLabel')}:{' '}
                    {CONTACT_INFO.privacyEmail}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
