import { useState, useCallback, useMemo, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Mail } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'

const Header = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  // Memoize navigation array to prevent recreating on every render
  const navigation = useMemo(
    () => [
      { name: 'Головна', href: '/' },
      { name: 'Послуги', href: '/services' },
      { name: 'Про нас', href: '/about' },
      { name: 'Галерея', href: '/gallery' },
      { name: 'Контакти', href: '/contact' },
    ],
    []
  )

  // Memoize isActive function
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  )

  // Memoize handlers
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsMenuOpen(prev => !prev)
    }
  }, [])
  const handleNavKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false)
    }
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" role="banner">
      {/* Top bar */}
      <div
        className="bg-slate-800 text-white py-2.5"
        role="complementary"
        aria-label="Контактна інформація"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1.5">
                <Phone
                  className="h-4 w-4 text-dental-teal"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="hover:text-dental-teal font-semibold tracking-wide transition-colors"
                  data-track-id="call_click"
                  data-track-category="outbound"
                  data-track-label="header_phone"
                  data-track-prop-destination={CONTACT_INFO.phoneRaw}
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
              <div className="flex items-center space-x-1.5">
                <Mail className="h-4 w-4 text-dental-teal" aria-hidden="true" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="hover:text-dental-teal font-semibold tracking-wide transition-colors"
                  data-track-id="email_click"
                  data-track-category="outbound"
                  data-track-label="header_email"
                  data-track-prop-destination={CONTACT_INFO.email}
                >
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
            <div className="hidden md:block text-gray-300">
              <span className="font-medium">
                {CONTACT_INFO.workingHours.weekdays} |{' '}
                {CONTACT_INFO.workingHours.saturday}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              aria-label="Dental Story - на головну"
              className="shrink-0"
            >
              <Logo variant="default" size="md" />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav
            className="hidden md:flex space-x-8"
            role="navigation"
            aria-label="Основна навігація"
          >
            {navigation.map(item => (
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
              className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
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
              onClick={toggleMenu}
              onKeyDown={handleMenuKeyDown}
              className="p-2 text-gray-700 hover:text-dental-blue focus:outline-none focus:ring-2 focus:ring-dental-teal focus:ring-offset-2 rounded-lg"
              aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div
            className="px-2 pt-2 pb-3 space-y-1 bg-white border-t shadow-lg"
            role="navigation"
            aria-label="Мобільне меню"
          >
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-lg text-gray-700 hover:text-dental-blue hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-dental-teal focus:ring-inset transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-dental-blue bg-blue-50 font-semibold'
                    : ''
                }`}
                onClick={closeMenu}
                onKeyDown={handleNavKeyDown}
                tabIndex={0}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-3 mt-4">
              <Link
                to="/booking"
                className="block px-6 py-4 min-h-[48px] bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-center font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                onClick={closeMenu}
                data-track-id="cta_book_now_mobile"
                data-track-category="navigation"
                data-track-label="mobile_cta"
              >
                📞 Записатись на прийом
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
})

Header.displayName = 'Header'

export default Header
