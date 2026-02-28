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
    <footer className="bg-[#1a2c30] text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo variant="white" size="md" />
              <span className="sr-only">Dental Story</span>
            </div>
            <p className="text-dental-secondary mb-4">{SITE_INFO.description}</p>
            <div className="flex space-x-4" aria-label="Соціальні мережі">
              <a
                href={CONTACT_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary hover:text-dental-primary transition-colors"
                aria-label="Facebook"
              >
                Facebook
              </a>
              <a
                href={CONTACT_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary hover:text-dental-primary transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href={CONTACT_INFO.social.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dental-secondary hover:text-dental-primary transition-colors"
                aria-label="Telegram"
              >
                Telegram
              </a>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Підписка на новини</h4>
              <p className="text-xs text-dental-muted mb-3">
                Отримуйте акції та корисні поради від наших лікарів
              </p>
              <div className="max-w-sm">
                <NewsletterSubscribe />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.navigation')}</h3>
            <nav aria-label={t('accessibility.siteNavigation')}>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-dental-secondary hover:text-dental-primary transition-colors"
                  >
                    {t('navigation.home')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-dental-secondary hover:text-dental-primary transition-colors"
                  >
                    {t('navigation.services')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-dental-secondary hover:text-dental-primary transition-colors"
                  >
                    {t('navigation.about')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/gallery"
                    className="text-dental-secondary hover:text-dental-primary transition-colors"
                  >
                    {t('navigation.gallery')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-dental-secondary hover:text-dental-primary transition-colors"
                  >
                    {t('navigation.contact')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/symptom-checker"
                    className="text-dental-secondary hover:text-dental-primary transition-colors flex items-center gap-1"
                  >
                    {t('ai.symptomChecker.title')}
                    <span className="text-xs bg-dental-primary text-dental-dark px-1.5 py-0.5 rounded">AI</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contacts')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone
                  className="h-4 w-4 text-dental-primary"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="text-dental-secondary hover:text-dental-primary transition-colors"
                >
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-dental-primary" aria-hidden="true" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-dental-secondary hover:text-dental-primary transition-colors"
                >
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin
                  className="h-4 w-4 text-dental-primary mt-1"
                  aria-hidden="true"
                />
                <address className="text-dental-secondary not-italic">
                  {CONTACT_INFO.address.full}
                  <br />
                  {CONTACT_INFO.address.postalCode}
                </address>
              </li>
              <li className="flex items-start space-x-2">
                <Clock
                  className="h-4 w-4 text-dental-primary mt-1"
                  aria-hidden="true"
                />
                <div className="text-dental-secondary">
                  <div>{CONTACT_INFO.workingHours.weekdays}</div>
                  <div>{CONTACT_INFO.workingHours.saturday}</div>
                  <div>{CONTACT_INFO.workingHours.sunday}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dental-muted/30 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-dental-muted text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/privacy-policy"
                className="text-dental-secondary hover:text-dental-primary text-sm transition-colors"
              >
                {t('navigation.privacyPolicy')}
              </Link>
              <Link
                href="/terms-of-service"
                className="text-dental-secondary hover:text-dental-primary text-sm transition-colors"
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
