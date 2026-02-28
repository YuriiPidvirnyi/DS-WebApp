'use client'

import { useState, useCallback, useMemo, memo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Menu, X, Phone, User, LogIn } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const Header = memo(() => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Track scroll for header style
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check auth state
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const navigation = useMemo(() => [
    { name: t('navigation.home'), href: '/' },
    { name: t('navigation.services'), href: '/services' },
    { name: t('navigation.about'), href: '/about' },
    { name: t('navigation.gallery'), href: '/gallery' },
    { name: t('navigation.contact'), href: '/contact' },
  ], [t])

  const isActive = useCallback((path: string) => pathname === path, [pathname])
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm' : 'bg-background'
      }`}
      role="banner"
    >
      {/* Top bar - hidden on mobile */}
      <div className="hidden sm:block bg-foreground text-background py-2">
        <div className="container-custom">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <a
              href={`tel:${CONTACT_INFO.phoneRaw}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-medium">{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-background/70">
              {CONTACT_INFO.workingHours.weekdays}
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-custom">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" aria-label="Dental Story - на головну" className="flex-shrink-0">
            <Logo variant="default" size="md" />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1" role="navigation">
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                suppressHydrationWarning
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            <LanguageSwitcher variant="dropdown" />
            
            {user ? (
              <Link
                href="/cabinet"
                className="btn-ghost text-sm"
              >
                <User className="h-4 w-4" />
                <span suppressHydrationWarning className="hidden xl:inline">{t('admin.sidebar.dashboard')}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-ghost text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span suppressHydrationWarning className="hidden xl:inline">{t('admin.login.login')}</span>
              </Link>
            )}
            
            <Link href="/booking" className="btn-primary text-sm px-4 xl:px-6 py-2.5" suppressHydrationWarning>
              {t('buttons.bookAppointment')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 -mr-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-custom py-4 space-y-1">
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary bg-primary/5'
                    : 'text-foreground hover:bg-muted'
                }`}
                suppressHydrationWarning
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 mt-4 border-t border-border space-y-3">
              <LanguageSwitcher variant="inline" className="justify-center" />
              
              <Link
                href="/booking"
                onClick={closeMenu}
                className="btn-primary w-full justify-center py-3.5 text-base"
                suppressHydrationWarning
              >
                <Phone className="h-5 w-5" />
                {t('buttons.bookAppointment')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
})

Header.displayName = 'Header'
export default Header
