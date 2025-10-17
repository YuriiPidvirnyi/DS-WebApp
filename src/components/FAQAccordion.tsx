import { useState } from 'react'
import type { FAQCategory } from '@/content/faqs'
import { ChevronDown } from 'lucide-react'

interface FAQAccordionProps {
  categories: FAQCategory[]
  defaultOpen?: number
}

export default function FAQAccordion({ categories, defaultOpen = 0 }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen)

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Поширені питання</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 px-5 pt-5">{cat.title}</h3>
              <div className="divide-y">
                {cat.items.map((qa, j) => {
                  const id = `${i}-${j}`
                  const isOpen = openIndex === i * 100 + j
                  return (
                    <div key={id}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
                        aria-expanded={isOpen}
                        onClick={() => setOpenIndex(isOpen ? null : i * 100 + j)}
                      >
                        <span className="font-medium text-gray-900">{qa.question}</span>
                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-gray-700">
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
