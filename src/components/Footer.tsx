'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Facebook, Instagram, Send } from 'lucide-react'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main grid: 4 equal columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Logo & Socials */}
          <div>
            <div className="mb-6">
              <Logo variant="white" size="sm" />
            </div>
            <p className="text-dental-secondary/75 text-sm leading-relaxed mb-8">
              {SITE_INFO.description}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-dental-primary-500 flex items-center justify-center transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-base">Навігація</h4>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-3">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-dental-secondary/75 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/symptom-checker"
                    className="text-dental-secondary/75 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-[10px] bg-dental-primary-500 text-white px-1.5 py-0.5 rounded font-semibold">
                      AI
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-base">Контакти</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-3 text-dental-secondary/75 hover:text-white transition-colors group text-sm"
                >
                  <Phone className="w-4 h-4 group-hover:text-dental-primary-400 flex-shrink-0" />
                  <span>{CONTACT_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-3 text-dental-secondary/75 hover:text-white transition-colors group text-sm"
                >
                  <Mail className="w-4 h-4 group-hover:text-dental-primary-400 flex-shrink-0" />
                  <span className="break-all">{CONTACT_INFO.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-dental-secondary/75 flex-shrink-0 mt-0.5" />
                <address className="text-dental-secondary/75 not-italic leading-relaxed">
                  {CONTACT_INFO.address.street}<br />
                  {CONTACT_INFO.address.city}<br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
            </ul>
          </div>

          {/* Column 4: Hours */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-base">Режим роботи</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="text-dental-secondary/60 text-xs font-medium mb-1">Пн-Пт</div>
                <div className="text-dental-secondary/80">{CONTACT_INFO.workingHours.weekdays}</div>
              </li>
              <li>
                <div className="text-dental-secondary/60 text-xs font-medium mb-1">Сб</div>
                <div className="text-dental-secondary/80">{CONTACT_INFO.workingHours.saturday}</div>
              </li>
              <li>
                <div className="text-dental-secondary/60 text-xs font-medium mb-1">Нд</div>
                <div className="text-dental-secondary/70">{CONTACT_INFO.workingHours.sunday}</div>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="pt-12 border-t border-white/10">
          <h4 className="font-semibold text-white mb-3 text-base">Підписка на новини</h4>
          <p className="text-dental-secondary/75 text-sm mb-6 max-w-md">
            Отримуйте акції та корисні поради від наших лікарів
          </p>
          <div className="max-w-md">
            <NewsletterSubscribe />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-dental-secondary/60">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6 text-dental-secondary/60 text-xs">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                {t('navigation.privacyPolicy')}
              </Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">
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
