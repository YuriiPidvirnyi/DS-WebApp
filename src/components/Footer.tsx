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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        {/*
          Layout: 3 columns
          Left  (5/12) — Logo, description, socials, contact
          Mid   (3/12) — Navigation + Working hours
          Right (4/12) — Newsletter CTA
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* LEFT — Brand + Contact */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Logo + description */}
            <div>
              <div className="mb-4">
                <Logo variant="white" size="sm" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                {SITE_INFO.description}
              </p>
            </div>

            {/* Contact details */}
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm group"
                >
                  <Phone className="w-4 h-4 flex-shrink-0 text-dental-primary-400 group-hover:text-dental-primary-300" />
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm group"
                >
                  <Mail className="w-4 h-4 flex-shrink-0 text-dental-primary-400 group-hover:text-dental-primary-300" />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-dental-primary-400" />
                <address className="not-italic leading-relaxed">
                  {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}, {CONTACT_INFO.address.postalCode}
                </address>
              </li>
            </ul>

            {/* Social links */}
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

          {/* MIDDLE — Navigation + Hours */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Navigation */}
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

            {/* Working hours */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-dental-primary-400" />
                Режим роботи
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between gap-4">
                  <span className="text-white/50">Пн–Пт</span>
                  <span className="text-white/80 font-medium tabular-nums">{CONTACT_INFO.workingHours.weekdays.replace('Пн-Пт: ', '')}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-white/50">Сб</span>
                  <span className="text-white/80 font-medium tabular-nums">{CONTACT_INFO.workingHours.saturday.replace('Сб: ', '')}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-white/50">Нд</span>
                  <span className="text-white/50 font-medium">{CONTACT_INFO.workingHours.sunday.replace('Нд: ', '')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT — Newsletter */}
          <div className="lg:col-span-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-center">
              <h4 className="text-white font-semibold text-base mb-2">
                Будьте в курсі новин
              </h4>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Отримуйте акції, поради лікарів та новини клініки прямо на пошту.
              </p>
              <NewsletterSubscribe />
            </div>
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
