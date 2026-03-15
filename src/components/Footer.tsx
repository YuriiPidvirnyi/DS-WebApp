'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Send } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import Logo from '@/components/ui/Logo'

const Footer = memo(() => {
  const { t } = useTranslation()
  
  const navLinks = [
    { href: '/', label: t('navigation.home') },
    { href: '/services', label: t('navigation.services') },
    { href: '/about', label: t('navigation.about') },
    { href: '/gallery', label: t('navigation.gallery') },
    { href: '/contact', label: t('navigation.contact') },
  ]

  return (
    <footer className="bg-dental-primary-900 text-white" role="contentinfo">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          
          {/* Logo & Description - 3 cols */}
          <div className="lg:col-span-3">
            <div className="mb-5">
              <Logo variant="white" size="md" />
            </div>
            <p className="text-dental-secondary/80 text-sm leading-relaxed mb-6">
              {SITE_INFO.description}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation - 2 cols */}
          <div className="lg:col-span-2 lg:pl-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              Навігація
            </h3>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-2.5">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-dental-secondary/90 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/symptom-checker"
                    className="text-dental-secondary/90 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-[10px] bg-dental-primary-500 text-white px-1.5 py-0.5 rounded font-medium">
                      AI
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact Info - 3 cols */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              Контакти
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-3 text-dental-secondary/90 hover:text-white transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-dental-primary-500 flex items-center justify-center transition-colors">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span className="text-sm">{CONTACT_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-3 text-dental-secondary/90 hover:text-white transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-dental-primary-500 flex items-center justify-center transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-sm">{CONTACT_INFO.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-dental-secondary/90" />
                </span>
                <address className="text-dental-secondary/90 not-italic text-sm leading-relaxed">
                  {CONTACT_INFO.address.full}<br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-dental-secondary/90" />
                </span>
                <div className="text-dental-secondary/90 text-sm leading-relaxed">
                  <div>{CONTACT_INFO.workingHours.weekdays}</div>
                  <div>{CONTACT_INFO.workingHours.saturday}</div>
                  <div className="text-dental-secondary/60">{CONTACT_INFO.workingHours.sunday}</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter - 4 cols */}
          <div className="lg:col-span-4 lg:pl-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              Підписка на новини
            </h3>
            <p className="text-dental-secondary/80 text-sm mb-4 leading-relaxed">
              Отримуйте акції та корисні поради від наших лікарів
            </p>
            <NewsletterSubscribe />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-dental-secondary/60 text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy-policy"
                className="text-dental-secondary/60 hover:text-white text-sm transition-colors"
              >
                {t('navigation.privacyPolicy')}
              </Link>
              <Link
                href="/terms-of-service"
                className="text-dental-secondary/60 hover:text-white text-sm transition-colors"
              >
                {t('navigation.termsOfService')}
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
