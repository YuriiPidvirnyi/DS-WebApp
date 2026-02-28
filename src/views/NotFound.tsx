'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Сторінку не знайдено
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          На жаль, сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>

        {/* Emoji */}
        <div className="text-6xl mb-8">🦷</div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary"
          >
            <Home className="h-5 w-5" />
            На головну
          </Link>

          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
            Повернутись назад
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Можливо, ви шукали:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/services" className="text-primary hover:underline">
              Послуги
            </Link>
            <span className="text-border">•</span>
            <Link href="/about" className="text-primary hover:underline">
              Про нас
            </Link>
            <span className="text-border">•</span>
            <Link href="/gallery" className="text-primary hover:underline">
              Галерея
            </Link>
            <span className="text-border">•</span>
            <Link href="/contact" className="text-primary hover:underline">
              Контакти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
