'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react'
import { CONTACT_INFO } from '@/utils/constants'

const MAPS_EMBED_URL = `https://www.google.com/maps?q=${CONTACT_INFO.coordinates.lat},${CONTACT_INFO.coordinates.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`
const MAPS_LINK = `https://maps.google.com/?q=${CONTACT_INFO.coordinates.lat},${CONTACT_INFO.coordinates.lng}`

const Footer = memo(() => {
  const { t } = useTranslation()

  return (
    <footer className="text-white" role="contentinfo">
      {/* ─── Map + Contact overlay ─── */}
      <div className="relative">
        {/* Full-width satellite map */}
        <div className="h-[480px] md:h-[380px] w-full">
          <iframe
            src={MAPS_EMBED_URL}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${CONTACT_INFO.address.street}, ${CONTACT_INFO.address.city}`}
          />
        </div>

        {/* Contact card overlay on map */}
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:left-8 md:bottom-8 md:w-[380px]">
          <div className="bg-dental-primary-900/95 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-dental-primary-400" />
              Dental Story
            </h3>

            <div className="space-y-3">
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-white/80 hover:text-dental-primary-400 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4 text-dental-primary-400 shrink-0 mt-0.5" />
                <span>
                  {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city}
                </span>
              </a>

              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-2.5 text-white/80 hover:text-dental-primary-400 transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-dental-primary-400 shrink-0" />
                <span className="font-medium">{CONTACT_INFO.phone}</span>
              </a>

              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-2.5 text-white/80 hover:text-dental-primary-400 transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-dental-primary-400 shrink-0" />
                <span>{CONTACT_INFO.email}</span>
              </a>

              <div className="flex items-center gap-2.5 text-white/60 text-sm">
                <Clock className="w-4 h-4 text-dental-primary-400 shrink-0" />
                <span>
                  {t('footer.workingHours.weekdays')} ·{' '}
                  {t('footer.workingHours.saturday')}
                </span>
              </div>
            </div>

            <Link
              href="/booking"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-dental-primary-600 hover:bg-dental-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              {t('buttons.bookAppointment')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
