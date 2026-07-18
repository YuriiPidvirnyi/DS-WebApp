'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-dental-teal">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-dental-dark mb-4">
          {t('notFound.title')}
        </h2>
        <p className="text-xl text-dental-muted mb-8">
          {t('notFound.description')}
        </p>

        {/* Emoji */}
        <div className="text-6xl mb-8">🦷</div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-dental-primary-800 text-white font-semibold rounded-lg hover:bg-dental-primary-900 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            {t('notFound.actions.home')}
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-dental-teal text-dental-teal font-semibold rounded-lg hover:bg-dental-teal hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('notFound.actions.back')}
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-dental-secondary-200">
          <p className="text-sm text-dental-muted mb-4">
            {t('notFound.suggestions.title')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/services" className="text-dental-teal hover:underline">
              {t('notFound.suggestions.services')}
            </Link>
            <span className="text-dental-secondary-300">•</span>
            <Link href="/about" className="text-dental-teal hover:underline">
              {t('notFound.suggestions.about')}
            </Link>
            <span className="text-dental-secondary-300">•</span>
            <Link href="/gallery" className="text-dental-teal hover:underline">
              {t('notFound.suggestions.gallery')}
            </Link>
            <span className="text-dental-secondary-300">•</span>
            <Link href="/contact" className="text-dental-teal hover:underline">
              {t('notFound.suggestions.contact')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
