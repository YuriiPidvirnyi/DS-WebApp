'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import Logo from '@/components/ui/Logo'

const Footer = memo(() => {
  const { t } = useTranslation()
  return (
    <footer className="bg-dental-primary-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        {/* Main grid - responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Logo, description and socials */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo variant="white" size="md" />
              <span className="sr-only">Dental Story</span>
            </div>
            <p className="text-dental-secondary-300 text-sm leading-relaxed mb-5 max-w-xs">
              {SITE_INFO.description}
            </p>
            <div className="flex gap-4" aria-label="Соціальні мережі">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                aria-label="Facebook"
              >
                Facebook
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                aria-label="Telegram"
              >
                Telegram
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-base font-semibold mb-4">{t('footer.navigation')}</h3>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                  >
                    {t('navigation.home')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                  >
                    {t('navigation.services')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                  >
                    {t('navigation.about')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                  >
                    {t('navigation.gallery')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                  >
                    {t('navigation.contact')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/symptom-checker"
                    className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm inline-flex items-center gap-1.5"
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-[10px] bg-dental-primary-400 text-dental-primary-900 px-1.5 py-0.5 rounded font-medium">AI</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-base font-semibold mb-4">{t('footer.contacts')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-dental-primary-400 flex-shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm"
                >
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-dental-primary-400 flex-shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-dental-secondary-300 hover:text-dental-primary-300 transition-colors text-sm break-all"
                >
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-dental-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <address className="text-dental-secondary-300 not-italic text-sm leading-relaxed">
                  {CONTACT_INFO.address.full}
                  <br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-dental-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-dental-secondary-300 text-sm leading-relaxed">
                  <div>{CONTACT_INFO.workingHours.weekdays}</div>
                  <div>{CONTACT_INFO.workingHours.saturday}</div>
                  <div>{CONTACT_INFO.workingHours.sunday}</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-base font-semibold mb-4">Підписка на новини</h3>
            <p className="text-dental-secondary-300 text-sm mb-4 leading-relaxed">
              Отримуйте акції та корисні поради від наших лікарів
            </p>
            <NewsletterSubscribe />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dental-primary-800/30 mt-10 pt-6 sm:mt-12 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-dental-text-light text-xs sm:text-sm text-center sm:text-left">
              {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link
                href="/privacy-policy"
                className="text-dental-secondary-300 hover:text-dental-primary-300 text-xs sm:text-sm transition-colors"
              >
                {t('navigation.privacyPolicy')}
              </Link>
              <Link
                href="/terms-of-service"
                className="text-dental-secondary-300 hover:text-dental-primary-300 text-xs sm:text-sm transition-colors"
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
