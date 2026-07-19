'use client'

import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ContactForm from '@/components/ContactForm'
import GoogleMap from '@/components/GoogleMap'
import CallbackRequest from '@/components/CallbackRequest'
import FAQ from '@/components/FAQ'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import { Card } from '@/components/ui'

const Contact = () => {
  const { t } = useTranslation()

  return (
    <div className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-dental-muted max-w-3xl mx-auto">
            {t('contact.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <ContactForm />

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <Card variant="dark" padding="lg">
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('contact.contactInfo')}
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 mt-1 text-white shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t('common.phone')}
                    </h3>
                    <a
                      href={`tel:${CONTACT_INFO.phoneRaw}`}
                      className="text-white hover:underline"
                      aria-label={`${t('common.phone')}: ${CONTACT_INFO.phone}`}
                      data-track-id="call_click"
                      data-track-category="outbound"
                      data-track-label="contact_phone"
                      data-track-prop-destination={CONTACT_INFO.phoneRaw}
                    >
                      {CONTACT_INFO.phone}
                    </a>
                    <p className="text-sm text-white/80">
                      {t('common.workingHours')}:{' '}
                      {CONTACT_INFO.workingHours.weekdays}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-white shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t('common.email')}
                    </h3>
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="text-white hover:underline"
                      aria-label={`${t('common.email')}: ${CONTACT_INFO.email}`}
                      data-track-id="email_click"
                      data-track-category="outbound"
                      data-track-label="contact_email"
                      data-track-prop-destination={CONTACT_INFO.email}
                    >
                      {CONTACT_INFO.email}
                    </a>
                    <p className="text-sm text-white/80">
                      {t('contact.responseTime')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 mt-1 text-white shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t('common.address')}
                    </h3>
                    <p className="text-white">{CONTACT_INFO.address.full}</p>
                    <p className="text-white">
                      {CONTACT_INFO.address.district}
                    </p>
                    <a
                      href={SITE_INFO.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/80 hover:text-white hover:underline"
                      aria-label={t('contact.viewOnMap')}
                    >
                      {t('contact.viewOnMap')}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-white shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {t('common.workingHours')}
                    </h3>
                    <p className="text-white">
                      {CONTACT_INFO.workingHours.weekdays}
                    </p>
                    <p className="text-white">
                      {CONTACT_INFO.workingHours.saturday}
                    </p>
                    <p className="text-white">
                      {CONTACT_INFO.workingHours.sunday}
                    </p>
                    <p className="text-sm text-white/80">
                      {CONTACT_INFO.workingHours.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Emergency */}
            <Card
              variant="ghost"
              padding="md"
              className="bg-dental-error-light border-dental-error"
            >
              <h3 className="text-lg font-bold text-dental-error-dark mb-3">
                {t('contact.emergency.title')}
              </h3>
              <p className="text-dental-error-dark mb-4">
                {t('contact.emergency.description')}
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-dental-error-dark">
                  <a
                    href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`}
                    className="hover:underline"
                  >
                    {/* Показуємо те саме джерело, що й у tel:, щоб текст і ціль
                        дзвінка не розходились per-environment */}
                    {CONTACT_INFO.emergencyPhone}
                  </a>
                </p>
                <p className="text-dental-error-dark text-sm">
                  {t('contact.emergency.availability')}
                </p>
              </div>
            </Card>

            {/* Quick callback */}
            <CallbackRequest />

            {/* Embedded Google Map */}
            <Card variant="filled" padding="none" className="overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-dental-primary mr-2 shrink-0" />
                  <h3
                    id="location-heading"
                    className="font-semibold text-dental-dark"
                  >
                    {t('contact.ourLocation')}
                  </h3>
                </div>
                <p className="text-dental-muted text-sm mb-4">
                  {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                </p>
              </div>
              <div
                className="relative h-80"
                role="region"
                aria-labelledby="location-heading"
              >
                <GoogleMap className="w-full h-full" height="100%" />
              </div>
              <div className="p-4 bg-white border-t border-dental-secondary-200">
                <a
                  href={SITE_INFO.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-dental-primary hover:text-dental-primary-600 font-medium text-sm"
                  data-track-id="open_maps"
                  data-track-category="navigation"
                  data-track-label="contact_map_link"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {t('contact.openInGoogleMaps')}
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />
      </div>
    </div>
  )
}

export default Contact
