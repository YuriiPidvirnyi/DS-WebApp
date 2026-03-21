'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FAQCategory } from '@/content/faqs'
import { ChevronDown } from 'lucide-react'

interface FAQAccordionProps {
  categories: FAQCategory[]
  defaultOpen?: number
}

export default function FAQAccordion({
  categories,
  defaultOpen = 0,
}: FAQAccordionProps) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen)

  const toggle = (index: number) =>
    setOpenIndex(prev => (prev === index ? null : index))

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {t('faqAccordion.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 px-5 pt-5">
                {cat.title}
              </h3>
              <div className="divide-y" role="list">
                {cat.items.map((qa, j) => {
                  const itemIndex = i * 100 + j
                  const isOpen = openIndex === itemIndex
                  const panelId = `faq-panel-${i}-${j}`
                  const buttonId = `faq-btn-${i}-${j}`

                  return (
                    <div key={`${i}-${j}`} role="listitem">
                      <button
                        id={buttonId}
                        type="button"
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary-500 focus-visible:ring-inset"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggle(itemIndex)}
                      >
                        <span className="font-medium text-gray-900">
                          {qa.question}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="px-5 pb-4 text-gray-700"
                        >
                          <p>{qa.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
