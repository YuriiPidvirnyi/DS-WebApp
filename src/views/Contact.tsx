'use client'

import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import ContactForm from '@/components/ContactForm'
import GoogleMap from '@/components/GoogleMap'
import CallbackRequest from '@/components/CallbackRequest'
import FAQ from '@/components/FAQ'
import { CONTACT_INFO } from '@/utils/constants'

const Contact = () => {
  const { t } = useTranslation()
  
  return (
    <div className="py-16">
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
            <div className="bg-gradient-to-br from-dental-primary to-dental-primary-600 text-white rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">{t('contact.contactInfo')}</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 mt-1 text-dental-accent" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('common.phone')}</h3>
                    <a
                      href={`tel:${CONTACT_INFO.phoneRaw}`}
                      className="hover:underline"
                      data-track-id="call_click"
                      data-track-category="outbound"
                      data-track-label="contact_phone"
                      data-track-prop-destination={CONTACT_INFO.phoneRaw}
                    >
                      {CONTACT_INFO.phone}
                    </a>
                    <p className="text-sm text-white/90">
                      {t('common.workingHours')}: {CONTACT_INFO.workingHours.weekdays}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-dental-accent" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('common.email')}</h3>
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="hover:underline"
                      data-track-id="email_click"
                      data-track-category="outbound"
                      data-track-label="contact_email"
                      data-track-prop-destination={CONTACT_INFO.email}
                    >
                      {CONTACT_INFO.email}
                    </a>
                    <p className="text-sm text-white/90">
                      Відповідаємо протягом 2 годин
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 mt-1 text-dental-accent" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('common.address')}</h3>
                    <p>{CONTACT_INFO.address.full}</p>
                    <p>{CONTACT_INFO.address.district}</p>
                    <a
                      href="https://maps.app.goo.gl/gprGw94tfAJH7xFSA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-100 hover:underline"
                    >
                      Переглянути на карті →
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-dental-accent" />
                  <div>
                    <h3 className="font-semibold mb-1">{t('common.workingHours')}</h3>
                    <p>{CONTACT_INFO.workingHours.weekdays}</p>
                    <p>{CONTACT_INFO.workingHours.saturday}</p>
                    <p>{CONTACT_INFO.workingHours.sunday}</p>
                    <p className="text-sm text-white/90">
                      {CONTACT_INFO.workingHours.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-dental-error-light border border-dental-error-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-dental-error mb-3">
                {t('contact.emergency.title')}
              </h3>
              <p className="text-dental-error mb-4">
                {t('contact.emergency.description')}
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-dental-error">
                  <a
                    href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`}
                    className="hover:underline"
                  >
                    {t('contact.emergency.phone')}
                  </a>
                </p>
                <p className="text-dental-error text-sm">
                  {t('contact.emergency.availability')}
                </p>
              </div>
            </div>

            {/* Quick callback */}
            <CallbackRequest />

            {/* Embedded Google Map */}
            <div className="bg-dental-secondary-50 rounded-2xl overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-dental-primary mr-2" />
                  <h3
                    id="location-heading"
                    className="font-semibold text-dental-dark"
                  >
                    Наше розташування
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
                  href="https://maps.app.goo.gl/gprGw94tfAJH7xFSA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-dental-primary hover:text-dental-primary-600 font-medium text-sm"
                  data-track-id="open_maps"
                  data-track-category="navigation"
                  data-track-label="contact_map_link"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Відкрити в Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />
      </div>
    </div>
  )
}

export default Contact

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <ContactForm />

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-gradient-to-br from-dental-blue to-dental-teal text-white rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Контактна інформація</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Телефон</h3>
                    <a
                      href={`tel:${CONTACT_INFO.phoneRaw}`}
                      className="hover:underline"
                      data-track-id="call_click"
                      data-track-category="outbound"
                      data-track-label="contact_phone"
                      data-track-prop-destination={CONTACT_INFO.phoneRaw}
                    >
                      {CONTACT_INFO.phone}
                    </a>
                    <p className="text-sm text-white/90">
                      Робочі години: {CONTACT_INFO.workingHours.weekdays}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="hover:underline"
                      data-track-id="email_click"
                      data-track-category="outbound"
                      data-track-label="contact_email"
                      data-track-prop-destination={CONTACT_INFO.email}
                    >
                      {CONTACT_INFO.email}
                    </a>
                    <p className="text-sm text-white/90">
                      Відповідаємо протягом 2 годин
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Адреса</h3>
                    <p>{CONTACT_INFO.address.full}</p>
                    <p>{CONTACT_INFO.address.district}</p>
                    <a
                      href="https://maps.app.goo.gl/gprGw94tfAJH7xFSA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-100 hover:underline"
                    >
                      Переглянути на карті →
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-yellow-300" />
                  <div>
                    <h3 className="font-semibold mb-1">Години роботи</h3>
                    <p>{CONTACT_INFO.workingHours.weekdays}</p>
                    <p>{CONTACT_INFO.workingHours.saturday}</p>
                    <p>{CONTACT_INFO.workingHours.sunday}</p>
                    <p className="text-sm text-white/90">
                      {CONTACT_INFO.workingHours.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-800 mb-3">
                🚨 Екстрена допомога
              </h3>
              <p className="text-red-700 mb-4">
                У разі гострого болю або травми зв'яжіться з нами:
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-red-800">
                  <a
                    href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`}
                    className="hover:underline"
                  >
                    📞 {CONTACT_INFO.emergencyPhone}
                  </a>
                </p>
                <p className="text-red-800 text-sm">
                  В робочі години та за необхідності
                </p>
              </div>
            </div>

            {/* Quick callback */}
            <CallbackRequest />

            {/* Embedded Google Map */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-dental-teal mr-2" />
                  <h3
                    id="location-heading"
                    className="font-semibold text-gray-900"
                  >
                    Наше розташування
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
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
              <div className="p-4 bg-white border-t">
                <a
                  href="https://maps.app.goo.gl/gprGw94tfAJH7xFSA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-teal-800 hover:text-teal-900 font-medium text-sm"
                  data-track-id="open_maps"
                  data-track-category="navigation"
                  data-track-label="contact_map_link"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Відкрити в Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <FAQ />
      </div>
    </div>
  )
}

export default Contact
