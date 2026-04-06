'use client'

import { useTranslation } from 'react-i18next'
import { CreditCard, Clock, FileText, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dental-dark mb-6">
        {t('cabinet.payments.title')}
      </h1>

      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center shadow-sm border border-dental-secondary-100">
        <div className="w-20 h-20 bg-dental-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-dental-primary-600" />
        </div>

        <h2 className="text-xl font-semibold text-dental-dark mb-2">
          {t('cabinet.payments.comingSoon')}
        </h2>
        <p className="text-dental-muted mb-8 max-w-md mx-auto">
          {t('cabinet.payments.description')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-2 p-4 bg-dental-secondary-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-dental-primary-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dental-dark">
                {t('cabinet.payments.feature1Title')}
              </p>
              <p className="text-xs text-dental-muted">
                {t('cabinet.payments.feature1Desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-dental-secondary-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-dental-primary-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dental-dark">
                {t('cabinet.payments.feature2Title')}
              </p>
              <p className="text-xs text-dental-muted">
                {t('cabinet.payments.feature2Desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-dental-secondary-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-dental-primary-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dental-dark">
                {t('cabinet.payments.feature3Title')}
              </p>
              <p className="text-xs text-dental-muted">
                {t('cabinet.payments.feature3Desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dental-secondary-100">
          <p className="text-sm text-dental-muted mb-3">
            {t('cabinet.payments.meanwhile')}
          </p>
          <Link
            href="/cabinet/treatments"
            className="inline-flex items-center gap-2 text-dental-primary-600 hover:text-dental-primary-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500 rounded-lg px-2 py-1 -mx-2"
          >
            <FileText className="w-4 h-4" />
            {t('cabinet.treatments.title')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
