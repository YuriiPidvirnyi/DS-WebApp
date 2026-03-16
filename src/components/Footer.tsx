'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Send, Twitter } from 'lucide-react'

// WhatsApp SVG icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// TikTok SVG icon
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.2 8.2 0 004.79 1.52V6.9a4.85 4.85 0 01-1.02-.21z"/>
  </svg>
)
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-12">
        {/* 2 main columns: left (logo+nav) | right (contacts+hours) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* LEFT: Logo + description + socials + newsletter */}
          <div className="flex flex-col h-full">
            {/* Logo + description */}
            <div className="mb-6">
              <div className="mb-4">
                <Logo variant="white" size="sm" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                {SITE_INFO.description}
              </p>
            </div>

            {/* Socials */}
            <div className="flex items-center flex-wrap gap-1.5 mb-5">
              {[
                { href: CONTACT_INFO.social.facebook, label: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
                { href: CONTACT_INFO.social.instagram, label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
                { href: CONTACT_INFO.social.telegram, label: 'Telegram', icon: <Send className="w-4 h-4" /> },
                { href: CONTACT_INFO.social.whatsapp, label: 'WhatsApp', icon: <WhatsAppIcon /> },
                { href: CONTACT_INFO.social.twitter, label: 'Twitter / X', icon: <Twitter className="w-4 h-4" /> },
                { href: CONTACT_INFO.social.tiktok, label: 'TikTok', icon: <TikTokIcon /> },
              ].map(({ href, label, icon }) => href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-dental-primary-500 flex items-center justify-center transition-colors duration-200"
                >
                  {icon}
                </a>
              ) : null)}
            </div>

            {/* Newsletter */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-auto">
              <h4 className="text-white font-semibold text-sm mb-1">Підписка на новини</h4>
              <p className="text-white/60 text-xs leading-relaxed mb-3">
                Отримуйте акції та поради від наших лікарів
              </p>
              <NewsletterSubscribe />
            </div>
          </div>

          {/* RIGHT: Navigation (left) | Hours + Contacts (right) */}
          <div className="grid grid-cols-2 gap-8 lg:gap-12">
            {/* Navigation */}
            <div className="flex flex-col">
              <h4 className="text-white font-semibold text-sm mb-4 h-fit">Навігація</h4>
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

            {/* Hours + Contacts stacked vertically */}
            <div className="flex flex-col gap-5">
              {/* Working hours — top */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 text-dental-primary-400" />
                  Режим роботи
                </h4>
                <ul className="space-y-1.5 text-sm ml-6">
                  <li className="flex justify-between gap-4">
                    <span className="text-white/50">Пн-Пт</span>
                    <span className="text-white/80 tabular-nums">09:00-21:00</span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span className="text-white/50">Сб</span>
                    <span className="text-white/80 tabular-nums">09:00-18:00</span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span className="text-white/50">Нд</span>
                    <span className="text-white/40">Вихідний</span>
                  </li>
                </ul>
              </div>

              {/* Contacts — below */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Контакти</h4>
                <ul className="space-y-2 ml-6">
                  <li>
                    <a
                      href={`tel:${CONTACT_INFO.phoneRaw}`}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0 text-dental-primary-400" />
                      {CONTACT_INFO.phone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0 text-dental-primary-400" />
                      {CONTACT_INFO.email}
                    </a>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-dental-primary-400 mt-0.5" />
                    <address className="not-italic leading-relaxed">
                      {CONTACT_INFO.address.street},<br />
                      {CONTACT_INFO.address.city}
                    </address>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
