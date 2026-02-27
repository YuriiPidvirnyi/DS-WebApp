'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'Чи потрібно записуватися заздалегідь?',
    answer:
      'Так, ми працюємо за попереднім записом. Це дозволяє нам приділити кожному пацієнту достатньо часу та уваги. Ви можете записатися онлайн через наш сайт або зателефонувавши за номером 068 232 38 38.',
  },
  {
    question: 'Чи можна перенести прийом?',
    answer:
      'Так, ви можете перенести прийом, повідомивши нас за 24 години до запланованого часу візиту. Це можна зробити через телефон або написавши нам у месенджери.',
  },
  {
    question: 'Які документи потрібні для прийому?',
    answer:
      'Візьміть з собою паспорт або інший документ, що посвідчує особу. Якщо у вас є попередня медична документація (знімки, аналізи, картка) - також приносьте її.',
  },
  {
    question: 'Чи надаєте ви гарантію на лікування?',
    answer:
      'Так, ми надаємо гарантію на всі види робіт згідно з медичними стандартами та вимогами. Термін гарантії залежить від виду процедури та обговорюється індивідуально.',
  },
  {
    question: 'Які способи оплати ви приймаєте?',
    answer:
      'Ми приймаємо готівку, оплату карткою (Visa, Mastercard), а також безготівковий розрахунок. Можливі розстрочки на певні види лікування.',
  },
  {
    question: 'Чи проводите ви консультації онлайн?',
    answer:
      'Так, ми можемо провести первинну консультацію онлайн через Telegram або Viber. Однак для точної діагностики та призначення лікування необхідний особистий огляд.',
  },
  {
    question: 'Скільки часу триває прийом?',
    answer:
      'Тривалість прийому залежить від типу процедури. Первинна консультація зазвичай займає 30-45 хвилин. Складні процедури можуть тривати від 1 до 2 годин.',
  },
  {
    question: 'Чи є у вас парковка?',
    answer:
      'Так, поряд з клінікою є зручна парковка. Також клініка розташована у доступному місці з хорошим транспортним сполученням.',
  },
]

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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-dental-teal flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 py-4 bg-gray-50 text-gray-600 border-t border-gray-200">
          {item.answer}
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Часті питання
          </h2>
          <p className="text-lg text-gray-600">
            Відповіді на найпопулярніші запитання наших пацієнтів
          </p>
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
          <p className="text-gray-600 mb-4">
            Не знайшли відповідь на своє питання?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-teal text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Зв'яжіться з нами
          </a>
        </div>
      </div>
    </div>
  )
}
