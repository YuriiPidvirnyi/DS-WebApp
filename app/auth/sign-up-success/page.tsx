'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-teal-600" />
          </div>
        </div>

        {/* Logo */}
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {t('common.brandName')}
          </h1>
        </Link>

        {/* Message */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t('auth.signUpSuccess.title')}
          </h2>

          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-teal-50 rounded-xl">
            <Mail className="w-6 h-6 text-teal-600" />
            <p className="text-slate-700">
              {t('auth.signUpSuccess.checkEmail')}
            </p>
          </div>

          <p className="text-slate-600 mb-6">
            {t('auth.signUpSuccess.description')}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-600 font-medium mb-2">
              {t('auth.signUpSuccess.noEmail.title')}
            </p>
            <ul className="text-sm text-slate-500 space-y-1">
              <li>{t('auth.signUpSuccess.noEmail.checkSpam')}</li>
              <li>{t('auth.signUpSuccess.noEmail.checkEmail')}</li>
              <li>{t('auth.signUpSuccess.noEmail.wait')}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {t('auth.signUpSuccess.goToLogin')}
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 inline-block"
            >
              {t('auth.signUpSuccess.goHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
