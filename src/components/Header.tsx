'use client'

import { useState, useCallback, useMemo, memo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Menu, X, Phone, Clock, User, LogIn, Calendar } from 'lucide-react'
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    <header role="banner" className="sticky top-0 z-50">
      {/* Top info bar */}
      <div className="hidden md:block bg-primary/5 border-b border-primary/10">
        <div className="container-custom">
          <div className="flex justify-between items-center py-2 text-sm">
            <div className="flex items-center gap-6">
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                <Phone className="h-4 w-4 text-primary" />
                {CONTACT_INFO.phone}
              </a>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary/70" />
                {CONTACT_INFO.workingHours.weekdays}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher variant="inline" />
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className={`transition-all duration-300 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-md' 
          : 'bg-background'
      }`}>
        <div className="container-custom">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" aria-label="Dental Story - home" className="flex-shrink-0">
              <Logo variant="default" size="md" />
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center" role="navigation">
              <ul className="flex items-center gap-1">
                {navigation.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      suppressHydrationWarning
                    >
                      {item.name}
                      {isActive(item.href) && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <Link
                  href="/cabinet"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span suppressHydrationWarning>{t('admin.sidebar.dashboard')}</span>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span suppressHydrationWarning>{t('admin.login.login')}</span>
                </Link>
              )}
              
              <Link 
                href="/booking" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                suppressHydrationWarning
              >
                <Calendar className="h-4 w-4" />
                {t('buttons.bookAppointment')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2.5 text-foreground hover:bg-muted rounded-xl transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background/98 backdrop-blur-sm z-40">
          <nav className="container-custom py-6">
            <ul className="space-y-1">
              {navigation.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center px-4 py-4 rounded-xl text-lg font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    suppressHydrationWarning
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-3 px-4 py-3 text-foreground"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{CONTACT_INFO.phone}</p>
                  <p className="text-sm text-muted-foreground">{CONTACT_INFO.workingHours.weekdays}</p>
                </div>
              </a>
              
              <div className="px-4">
                <LanguageSwitcher variant="inline" className="justify-start" />
              </div>
              
              <div className="px-4 pt-2">
                <Link
                  href="/booking"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold hover:bg-primary/90 transition-colors"
                  suppressHydrationWarning
                >
                  <Calendar className="h-5 w-5" />
                  {t('buttons.bookAppointment')}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
})

Header.displayName = 'Header'
export default Header
