'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import Logo from '@/components/ui/Logo'

const Footer = memo(() => {
  const { t } = useTranslation()
  
  const quickLinks = [
    { href: '/', label: t('navigation.home') },
    { href: '/services', label: t('navigation.services') },
    { href: '/about', label: t('navigation.about') },
    { href: '/gallery', label: t('navigation.gallery') },
    { href: '/contact', label: t('navigation.contact') },
  ]

  const socialLinks = [
    { href: CONTACT_INFO.social.facebook, label: 'Facebook' },
    { href: CONTACT_INFO.social.instagram, label: 'Instagram' },
    { href: CONTACT_INFO.social.telegram, label: 'Telegram' },
  ]

  return (
    <footer className="bg-foreground text-background" role="contentinfo">
      <div className="container-custom py-12 sm:py-16 lg:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4 sm:space-y-6">
            <Logo variant="white" size="md" />
            <p className="text-background/70 text-sm sm:text-base leading-relaxed max-w-xs">
              {SITE_INFO.description}
            </p>
            <div className="flex gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/60 hover:text-background transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6" suppressHydrationWarning>
              {t('footer.navigation')}
            </h3>
            <nav>
              <ul className="space-y-2 sm:space-y-3">
                {quickLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-background/70 hover:text-background transition-colors text-sm sm:text-base"
                      suppressHydrationWarning
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/symptom-checker"
                    className="inline-flex items-center gap-2 text-background/70 hover:text-background transition-colors text-sm sm:text-base"
                    suppressHydrationWarning
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-[10px] sm:text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">AI</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6" suppressHydrationWarning>
              {t('footer.contacts')}
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-2 sm:gap-3 text-background/70 hover:text-background transition-colors group"
                >
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">{CONTACT_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-2 sm:gap-3 text-background/70 hover:text-background transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">{CONTACT_INFO.email}</span>
                </a>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <address className="text-background/70 not-italic text-sm sm:text-base" suppressHydrationWarning>
                  {CONTACT_INFO.address.full}
                </address>
              </li>
              <li className="flex gap-2 sm:gap-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-background/70 text-sm sm:text-base" suppressHydrationWarning>
                  <p>{CONTACT_INFO.workingHours.weekdays}</p>
                  <p>{CONTACT_INFO.workingHours.saturday}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6">Новини та акції</h3>
            <p className="text-background/70 text-sm mb-4">
              Отримуйте корисні поради від наших лікарів
            </p>
            <NewsletterSubscribe />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-background/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-xs sm:text-sm text-center sm:text-left" suppressHydrationWarning>
              {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link
                href="/privacy-policy"
                className="text-background/50 hover:text-background text-xs sm:text-sm transition-colors inline-flex items-center gap-1"
                suppressHydrationWarning
              >
                {t('navigation.privacyPolicy')}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
              <Link
                href="/terms-of-service"
                className="text-background/50 hover:text-background text-xs sm:text-sm transition-colors inline-flex items-center gap-1"
                suppressHydrationWarning
              >
                {t('navigation.termsOfService')}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'
export default Footer
