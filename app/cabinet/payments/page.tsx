'use client'

import { useTranslation } from 'react-i18next'
import { CreditCard, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dental-dark mb-6">
        {t('cabinet.payments.title', { defaultValue: 'Платежі' })}
      </h1>

      <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-dental-secondary-100">
        <div className="w-20 h-20 bg-dental-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-dental-primary-600" />
        </div>

        <h2 className="text-xl font-semibold text-dental-dark mb-2">
          {t('cabinet.payments.comingSoon', {
            defaultValue: 'Скоро буде доступно',
          })}
        </h2>
        <p className="text-dental-muted mb-8 max-w-md mx-auto">
          {t('cabinet.payments.description', {
            defaultValue:
              'Ми працюємо над зручною системою оплати. Незабаром ви зможете переглядати рахунки та здійснювати оплату онлайн.',
          })}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="flex items-center gap-3 p-4 bg-dental-secondary-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-dental-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-dental-dark">
                {t('cabinet.payments.feature1Title', {
                  defaultValue: 'Рахунки',
                })}
              </p>
              <p className="text-xs text-dental-muted">
                {t('cabinet.payments.feature1Desc', {
                  defaultValue: 'Перегляд історії оплат',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-dental-secondary-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-dental-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-dental-dark">
                {t('cabinet.payments.feature2Title', {
                  defaultValue: 'Онлайн-оплата',
                })}
              </p>
              <p className="text-xs text-dental-muted">
                {t('cabinet.payments.feature2Desc', {
                  defaultValue: 'Зручна оплата картою',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dental-secondary-100">
          <p className="text-sm text-dental-muted mb-3">
            {t('cabinet.payments.meanwhile', {
              defaultValue:
                'Тим часом ви можете переглянути свою історію лікування',
            })}
          </p>
          <Link
            href="/cabinet/treatments"
            className="inline-flex items-center gap-2 text-dental-primary-600 hover:text-dental-primary-700 font-medium text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t('cabinet.treatments.title', {
              defaultValue: 'Історія лікування',
            })}
          </Link>
        </div>
      </div>
    </div>
  )
}
