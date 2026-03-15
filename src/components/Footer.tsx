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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {/* 4 equal columns for balanced layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Column 1: Logo + Description + Socials */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <Logo variant="white" size="sm" />
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Сучасна стоматологічна клініка у Львові з повним спектром послуг.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Навігація</h4>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-2.5">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/symptom-checker"
                    className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-[10px] bg-dental-primary-500 text-white px-1.5 py-0.5 rounded font-semibold leading-none">
                      AI
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Contact + Hours */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Контакти</h4>
            <ul className="space-y-3 mb-6">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                  <Phone className="w-4 h-4 text-dental-primary-400" />
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                  <Mail className="w-4 h-4 text-dental-primary-400" />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-dental-primary-400 mt-0.5 flex-shrink-0" />
                <span>{CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}</span>
              </li>
            </ul>
            
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-dental-primary-400" />
              Режим роботи
            </h4>
            <ul className="space-y-1.5 text-sm text-white/60">
              <li>Пн-Пт: 09:00-21:00</li>
              <li>Сб: 09:00-18:00</li>
              <li className="text-white/40">Нд: Вихідний</li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Підписка</h4>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Отримуйте акції та поради від наших лікарів
            </p>
            <NewsletterSubscribe />
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy-policy"
              className="text-white/40 hover:text-white/80 text-xs transition-colors"
            >
              {t('navigation.privacyPolicy')}
            </Link>
            <Link
              href="/terms-of-service"
              className="text-white/40 hover:text-white/80 text-xs transition-colors"
            >
              {t('navigation.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
