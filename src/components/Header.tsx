import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Mail } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Головна', href: '/' },
    { name: 'Послуги', href: '/services' },
    { name: 'Про нас', href: '/about' },
    { name: 'Галерея', href: '/gallery' },
    { name: 'Контакти', href: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" role="banner">
      {/* Top bar */}
      <div className="bg-dental-blue text-white py-2" role="complementary" aria-label="Контактна інформація">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <a 
                  href={`tel:${CONTACT_INFO.phoneRaw}`} 
                  className="hover:underline"
                  data-track-id="call_click"
                  data-track-category="outbound"
                  data-track-label="header_phone"
                  data-track-prop-destination={CONTACT_INFO.phoneRaw}
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a 
                  href={`mailto:${CONTACT_INFO.email}`} 
                  className="hover:underline"
                  data-track-id="email_click"
                  data-track-category="outbound"
                  data-track-label="header_email"
                  data-track-prop-destination={CONTACT_INFO.email}
                >
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <span>{CONTACT_INFO.workingHours.weekdays} | {CONTACT_INFO.workingHours.saturday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-dental-blue">
              Dental Story
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Основна навігація">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-gray-700 hover:text-dental-blue transition-colors duration-200 font-medium ${
                  isActive(item.href)
                    ? 'text-dental-blue border-b-2 border-dental-blue'
                    : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              to="/booking"
              className="bg-dental-teal hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              data-track-id="cta_book_now"
              data-track-category="navigation"
              data-track-label="header_cta"
            >
              Записатись на прийом
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-dental-blue"
              aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t" role="navigation" aria-label="Мобільне меню">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-gray-700 hover:text-dental-blue transition-colors duration-200 ${
                  isActive(item.href) ? 'text-dental-blue bg-blue-50' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/contact"
              className="block px-3 py-2 bg-dental-teal text-white rounded-lg text-center font-medium mt-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Записатись на прийом
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header