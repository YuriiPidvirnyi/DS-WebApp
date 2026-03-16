'use client'

import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center px-4 py-12">
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
            Dental<span className="text-teal-600">Story</span>
          </h1>
        </Link>

        {/* Message */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Реєстрація успішна!
          </h2>
          
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-teal-50 rounded-xl">
            <Mail className="w-6 h-6 text-teal-600" />
            <p className="text-slate-700">
              Перевірте вашу електронну пошту
            </p>
          </div>

          <p className="text-slate-600 mb-6">
            Ми надіслали лист з посиланням для підтвердження вашого облікового запису. 
            Перейдіть за посиланням у листі, щоб активувати акаунт.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-600 font-medium mb-2">Не отримали листа?</p>
            <ul className="text-sm text-slate-500 space-y-1">
              <li>• Перевірте папку "Спам"</li>
              <li>• Переконайтеся, що email вказано правильно</li>
              <li>• Зачекайте кілька хвилин</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              Перейти до входу
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <Link
              href="/"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 inline-block"
            >
              На головну
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
