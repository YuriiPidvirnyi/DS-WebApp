import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Helmet>
        <title>404 — Сторінку не знайдено | Dental Story</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center max-w-2xl">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-dental-teal">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Сторінку не знайдено
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          На жаль, сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>

        {/* Emoji */}
        <div className="text-6xl mb-8">🦷</div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-teal-800 text-white font-semibold rounded-lg hover:bg-teal-900 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            На головну
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-dental-teal text-dental-teal font-semibold rounded-lg hover:bg-dental-teal hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Повернутись назад
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Можливо, ви шукали:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/services" className="text-dental-teal hover:underline">
              Послуги
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/about" className="text-dental-teal hover:underline">
              Про нас
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/gallery" className="text-dental-teal hover:underline">
              Галерея
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/contact" className="text-dental-teal hover:underline">
              Контакти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
