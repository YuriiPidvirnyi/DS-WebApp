'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}

const FAQAccordionItem = ({
  item,
  isOpen,
  onToggle,
}: FAQAccordionItemProps) => {
  return (
    <div className="border border-dental-secondary-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-dental-secondary-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-dental-dark pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-dental-teal shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 py-4 bg-dental-secondary-50 text-dental-muted border-t border-dental-secondary-200">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const translatedItems = t('faqPage.items', { returnObjects: true }) as unknown
  const faqData = Array.isArray(translatedItems)
    ? (translatedItems as FAQItem[])
    : []

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-dental-dark mb-4">
            {t('faqPage.title')}
          </h2>
          <p className="text-lg text-dental-muted">{t('faqPage.subtitle')}</p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-dental-muted mb-4">{t('faqPage.cta.question')}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-primary-700 text-white font-semibold rounded-lg hover:bg-dental-primary-800 transition-colors"
          >
            {t('faqPage.cta.contact')}
          </Link>
        </div>
      </div>
    </div>
  )
}
