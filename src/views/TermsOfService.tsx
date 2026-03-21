'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

interface TermsSubsection {
  title: string
  list: string[]
}

interface TermsSection {
  id: string
  title: string
  paragraphs?: string[]
  paragraphsAfter?: string[]
  list?: string[]
  subsections?: TermsSubsection[]
  link?: {
    before: string
    text: string
    after?: string
  }
}

const TermsOfService = () => {
  const { t } = useTranslation()
  const translatedSections = t('termsOfServicePage.sections', {
    returnObjects: true,
  }) as unknown
  const sections = Array.isArray(translatedSections)
    ? (translatedSections as TermsSection[])
    : []

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-dental-teal hover:text-teal-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('termsOfServicePage.backHome')}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('termsOfServicePage.title')}
          </h1>
          <p className="text-gray-600">{t('termsOfServicePage.lastUpdated')}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {sections.map(section => (
            <section key={section.id} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph, idx) => (
                <p
                  key={idx}
                  className={`text-gray-700 leading-relaxed ${
                    idx + 1 === (section.paragraphs?.length || 0) &&
                    !section.list &&
                    !section.subsections &&
                    !section.link
                      ? ''
                      : 'mb-4'
                  }`}
                >
                  {paragraph}
                </p>
              ))}

              {section.link && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {section.link.before}{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-dental-teal hover:underline"
                  >
                    {section.link.text}
                  </Link>
                  {section.link.after || ''}
                </p>
              )}

              {section.list && section.list.length > 0 && (
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  {section.list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}

              {section.subsections && section.subsections.length > 0 && (
                <div className="space-y-4">
                  {section.subsections.map((subsection, idx) => (
                    <div key={idx}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {subsection.title}
                      </h3>
                      <ul className="list-disc pl-6 text-gray-700 space-y-1">
                        {subsection.list.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {section.paragraphsAfter?.map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 leading-relaxed mt-4">
                  {paragraph}
                </p>
              ))}

              {section.id === 'contact' && (
                <div className="bg-gray-50 p-6 rounded-lg mt-4">
                  <p className="text-gray-700 mb-2">
                    <strong>
                      {t('termsOfServicePage.contactCard.clinic', {
                        name: SITE_INFO.name,
                      })}
                    </strong>
                  </p>
                  <p className="text-gray-700 mb-2">
                    {t('termsOfServicePage.contactCard.addressLabel')}:{' '}
                    {CONTACT_INFO.address.fullWithPostal}
                  </p>
                  <p className="text-gray-700 mb-2">
                    {t('termsOfServicePage.contactCard.phoneLabel')}:{' '}
                    {CONTACT_INFO.phone}
                  </p>
                  <p className="text-gray-700">
                    {t('termsOfServicePage.contactCard.emailLabel')}:{' '}
                    {CONTACT_INFO.email}
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

export default TermsOfService
