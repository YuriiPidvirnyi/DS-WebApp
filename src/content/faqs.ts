import type { TFunction } from 'i18next'

export type FAQItem = {
  question: string
  answer: string
}

export type FAQCategory = {
  title: string
  items: FAQItem[]
}

export function getAllFaqs(t: TFunction): FAQCategory[] {
  return [
    {
      title: t('servicesFaq.general.title'),
      items: [
        {
          question: t('servicesFaq.general.items.booking.question'),
          answer: t('servicesFaq.general.items.booking.answer'),
        },
        {
          question: t('servicesFaq.general.items.pain.question'),
          answer: t('servicesFaq.general.items.pain.answer'),
        },
        {
          question: t('servicesFaq.general.items.warranty.question'),
          answer: t('servicesFaq.general.items.warranty.answer'),
        },
      ],
    },
    {
      title: t('servicesFaq.services.title'),
      items: [
        {
          question: t('servicesFaq.services.items.caries.question'),
          answer: t('servicesFaq.services.items.caries.answer'),
        },
        {
          question: t('servicesFaq.services.items.freeConsultation.question'),
          answer: t('servicesFaq.services.items.freeConsultation.answer'),
        },
        {
          question: t('servicesFaq.services.items.installments.question'),
          answer: t('servicesFaq.services.items.installments.answer'),
        },
      ],
    },
    {
      title: t('servicesFaq.hygiene.title'),
      items: [
        {
          question: t('servicesFaq.hygiene.items.frequency.question'),
          answer: t('servicesFaq.hygiene.items.frequency.answer'),
        },
        {
          question: t('servicesFaq.hygiene.items.products.question'),
          answer: t('servicesFaq.hygiene.items.products.answer'),
        },
      ],
    },
  ]
}
