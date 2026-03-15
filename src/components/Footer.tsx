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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Left: Logo & Description - 4 cols */}
          <div className="md:col-span-4">
            <div className="mb-4">
              <Logo variant="white" size="md" />
            </div>
            <p className="text-dental-secondary/80 text-sm leading-relaxed mb-6 max-w-xs">
              {SITE_INFO.description}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors duration-200"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Middle: Navigation + Contact - 4 cols */}
          <div className="md:col-span-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Navigation */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
                  {t('navigation.menu')}
                </h3>
                <nav aria-label={t('accessibility.siteNavigation')}>
                  <ul className="space-y-3">
                    {navLinks.map(link => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-dental-secondary/80 hover:text-white transition-colors duration-200 text-sm font-medium"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/symptom-checker"
                        className="text-dental-secondary/80 hover:text-white transition-colors duration-200 text-sm font-medium inline-flex items-center gap-2"
                      >
                        {t('ai.symptomChecker.title')}
                        <span className="text-[10px] bg-dental-primary-500 text-white px-1.5 py-0.5 rounded-md font-semibold">
                          AI
                        </span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Hours */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
                  Режим роботи
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-white/60 text-xs font-medium mb-1">Пн-Пт:</div>
                    <p className="text-dental-secondary/80 font-medium">{CONTACT_INFO.workingHours.weekdays}</p>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs font-medium mb-1">Сб:</div>
                    <p className="text-dental-secondary/80 font-medium">{CONTACT_INFO.workingHours.saturday}</p>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs font-medium mb-1">Нд:</div>
                    <p className="text-dental-secondary/60 font-medium">{CONTACT_INFO.workingHours.sunday}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Info - 4 cols */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-5">
              Контакти
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-start gap-3 text-dental-secondary/80 hover:text-white transition-colors duration-200 group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-dental-primary-500 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium">{CONTACT_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-start gap-3 text-dental-secondary/80 hover:text-white transition-colors duration-200 group"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-dental-primary-500 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium break-all">{CONTACT_INFO.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </span>
                <address className="text-dental-secondary/80 not-italic text-sm font-medium leading-relaxed">
                  {CONTACT_INFO.address.street}<br />
                  {CONTACT_INFO.address.city}<br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter - Full width, below main grid */}
        <div className="mt-12 pt-12 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
                Підписка на новини
              </h3>
              <p className="text-dental-secondary/80 text-sm leading-relaxed mb-6 max-w-sm">
                Отримуйте акції та корисні поради від наших лікарів
              </p>
            </div>
            <div>
              <NewsletterSubscribe />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-dental-secondary/60 text-xs font-medium">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy-policy"
                className="text-dental-secondary/60 hover:text-white text-xs font-medium transition-colors duration-200"
              >
                {t('navigation.privacyPolicy')}
              </Link>
              <Link
                href="/terms-of-service"
                className="text-dental-secondary/60 hover:text-white text-xs font-medium transition-colors duration-200"
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
