'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Send,
  Twitter,
  Calendar,
} from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import Logo from '@/components/ui/Logo'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.2 8.2 0 004.79 1.52V6.9a4.85 4.85 0 01-1.02-.21z" />
  </svg>
)

const Footer = memo(() => {
  const { t } = useTranslation()

  const socials = [
    {
      href: CONTACT_INFO.social.facebook,
      label: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
    },
    {
      href: CONTACT_INFO.social.instagram,
      label: 'Instagram',
      icon: <Instagram className="w-4 h-4" />,
    },
    {
      href: CONTACT_INFO.social.telegram,
      label: 'Telegram',
      icon: <Send className="w-4 h-4" />,
    },
    {
      href: CONTACT_INFO.social.whatsapp,
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
    },
    {
      href: CONTACT_INFO.social.twitter,
      label: 'Twitter / X',
      icon: <Twitter className="w-4 h-4" />,
    },
    { href: CONTACT_INFO.social.tiktok, label: 'TikTok', icon: <TikTokIcon /> },
  ]

  const headingClass =
    'text-white/70 font-semibold text-[11px] uppercase tracking-[0.15em] mb-4'
  const linkClass =
    'text-white/40 hover:text-white text-[13px] transition-colors'

  return (
    <footer className="bg-dental-primary-900 text-white" role="contentinfo">
      {/* ─── Top: Logo + socials ─── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-6 border-b border-white/[0.06]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="white" size="sm" />
            <span className="hidden md:block w-px h-6 bg-white/10" />
            <p className="hidden md:block text-white/30 text-[13px] max-w-xs leading-relaxed">
              {SITE_INFO.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {socials.map(({ href, label, icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-dental-primary-600 flex items-center justify-center transition-all duration-200 text-white/30 hover:text-white"
                >
                  {icon}
                </a>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* ─── Middle: columns ─── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
          {/* Col 1: Navigation */}
          <div>
            <h4 className={headingClass}>{t('footer.navigation')}</h4>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-2">
                {[
                  { href: '/', label: t('navigation.home') },
                  { href: '/services', label: t('navigation.services') },
                  { href: '/about', label: t('navigation.about') },
                  { href: '/gallery', label: t('navigation.gallery') },
                  { href: '/contact', label: t('navigation.contact') },
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Col 2: Contact + Hours */}
          <div>
            <h4 className={headingClass}>{t('footer.contacts')}</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-dental-primary-400 shrink-0" />
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-dental-primary-400 shrink-0" />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://maps.google.com/?q=${CONTACT_INFO.coordinates.lat},${CONTACT_INFO.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-dental-primary-400 shrink-0" />
                  <span>
                    {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                  </span>
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[12px] text-white/25 leading-relaxed">
              {t('footer.workingHours.weekdays')} ·{' '}
              {t('footer.workingHours.saturday')}
              <br />
              {t('footer.workingHours.sunday')}
            </p>
          </div>

          {/* Col 3: CTA */}
          <div>
            <h4 className={headingClass}>{t('footer.appointment')}</h4>
            <p className="text-white/30 text-[13px] leading-relaxed mb-4">
              {t('footer.appointmentDesc')}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200"
            >
              <Calendar className="w-4 h-4" />
              {t('buttons.bookAppointment')}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 pb-20 md:pb-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-white/20">
          <span>{t('footer.copyright')}</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="hover:text-white/50 transition-colors"
            >
              {t('navigation.privacyPolicy')}
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-white/50 transition-colors"
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
