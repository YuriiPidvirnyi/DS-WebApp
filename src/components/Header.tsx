'use client'

import { useState, useCallback, useMemo, memo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Menu, X, Phone, Mail, User, LogIn } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const Header = memo(() => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const pathname = usePathname()

  // Check auth state
  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Memoize navigation array - recreate when language changes
  const navigation = useMemo(
    () => [
      { name: t('navigation.home'), href: '/' },
      { name: t('navigation.services'), href: '/services' },
      { name: t('navigation.about'), href: '/about' },
      { name: t('navigation.gallery'), href: '/gallery' },
      { name: t('navigation.contact'), href: '/contact' },
    ],
    [t]
  )

  // Memoize isActive function
  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
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
        className="bg-dental-dark text-white py-2.5"
        role="complementary"
        aria-label="Контактна інформація"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1.5">
                <Phone
                  className="h-4 w-4 text-dental-primary"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="hover:text-dental-primary font-semibold tracking-wide transition-colors"
                  data-track-id="call_click"
                  data-track-category="outbound"
                  data-track-label="header_phone"
                  data-track-prop-destination={CONTACT_INFO.phoneRaw}
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
              <div className="flex items-center space-x-1.5">
                <Mail className="h-4 w-4 text-dental-primary" aria-hidden="true" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="hover:text-dental-primary font-semibold tracking-wide transition-colors"
                  data-track-id="email_click"
                  data-track-category="outbound"
                  data-track-label="header_email"
                  data-track-prop-destination={CONTACT_INFO.email}
                >
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
            <div className="hidden md:block text-dental-secondary">
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
              href="/"
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
                href={item.href}
                className={`text-dental-text hover:text-dental-primary-dark transition-colors duration-200 font-medium ${
                  isActive(item.href)
                    ? 'text-dental-primary-dark border-b-2 border-dental-primary'
                    : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA & Auth & Language */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher variant="dropdown" />
            {user ? (
              <Link
                href="/cabinet"
                className="flex items-center gap-2 text-dental-text hover:text-dental-primary-dark transition-colors"
              >
                <User className="w-5 h-5" />
                <span>{t('admin.sidebar.dashboard')}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-dental-text hover:text-dental-primary-dark transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>{t('admin.login.login')}</span>
              </Link>
            )}
            <Link
              href="/booking"
              className="bg-dental-primary-darker hover:bg-dental-dark text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              data-track-id="cta_book_now"
              data-track-category="navigation"
              data-track-label="header_cta"
            >
              {t('buttons.bookAppointment')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              onKeyDown={handleMenuKeyDown}
              className="p-2 text-dental-text hover:text-dental-primary-dark focus:outline-none focus:ring-2 focus:ring-dental-primary focus:ring-offset-2 rounded-lg"
              aria-label={isMenuOpen ? t('accessibility.closeMenu') : t('accessibility.openMenu')}
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
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-dental-text hover:text-dental-primary-dark hover:bg-dental-primary/10 focus:outline-none focus:ring-2 focus:ring-dental-primary focus:ring-inset transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-dental-primary-dark bg-dental-primary/10 font-semibold'
                    : ''
                }`}
                onClick={closeMenu}
                onKeyDown={handleNavKeyDown}
                tabIndex={0}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-3 pt-4 border-t border-dental-secondary/30">
              <LanguageSwitcher variant="inline" className="mb-4 justify-center" />
              <Link
                href="/booking"
                className="block px-6 py-4 min-h-[48px] bg-dental-primary-darker hover:bg-dental-dark text-white rounded-xl text-center font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                onClick={closeMenu}
                data-track-id="cta_book_now_mobile"
                data-track-category="navigation"
                data-track-label="mobile_cta"
              >
                {t('buttons.bookAppointment')}
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
