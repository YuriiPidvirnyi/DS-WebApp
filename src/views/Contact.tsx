'use client'

import { Phone, Mail, MapPin, Clock, ExternalLink, AlertCircle } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import GoogleMap from '@/components/GoogleMap'
import CallbackRequest from '@/components/CallbackRequest'
import FAQ from '@/components/FAQ'
import { CONTACT_INFO } from '@/utils/constants'

const Contact = () => {
  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">
            Зв'яжіться з нами
          </span>
          <h1 className="mb-4">Контакти</h1>
          <p className="text-responsive-base max-w-2xl mx-auto">
            Ми завжди раді вам допомогти. Зв'яжіться зручним способом або 
            завітайте до нашої клініки у центрі Львова.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact Form - Takes more space */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="card-elevated p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Напишіть нам</h2>
              <ContactForm />
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {/* Main contact card */}
            <div className="bg-foreground text-background rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-semibold mb-6">Контактна інформація</h2>

              <div className="space-y-5">
                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {CONTACT_INFO.phone}
                    </p>
                    <p className="text-sm text-background/60">Телефонуйте нам</p>
                  </div>
                </a>

                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {CONTACT_INFO.email}
                    </p>
                    <p className="text-sm text-background/60">Напишіть нам</p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{CONTACT_INFO.address.street}</p>
                    <p className="text-sm text-background/60">{CONTACT_INFO.address.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{CONTACT_INFO.workingHours.weekdays}</p>
                    <p className="text-sm text-background/60">{CONTACT_INFO.workingHours.saturday}</p>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="mt-8 pt-6 border-t border-background/10">
                <p className="text-sm text-background/60 mb-3">Ми в соціальних мережах</p>
                <div className="flex gap-3">
                  <a
                    href={CONTACT_INFO.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/80 hover:text-primary transition-colors text-sm font-medium"
                  >
                    Instagram
                  </a>
                  <a
                    href={CONTACT_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/80 hover:text-primary transition-colors text-sm font-medium"
                  >
                    Facebook
                  </a>
                  <a
                    href={CONTACT_INFO.social.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/80 hover:text-primary transition-colors text-sm font-medium"
                  >
                    Telegram
                  </a>
                </div>
              </div>
            </div>

            {/* Emergency card */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1">Екстрена допомога</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Гострий біль? Зателефонуйте негайно:
                  </p>
                  <a
                    href={`tel:${CONTACT_INFO.emergencyPhoneRaw}`}
                    className="font-semibold text-destructive hover:underline"
                  >
                    {CONTACT_INFO.emergencyPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick callback */}
            <CallbackRequest />
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 lg:mt-20">
          <div className="card-elevated overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Як нас знайти</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {CONTACT_INFO.address.full}
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/6CNarQSYFyQjrUHG8"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm px-4 py-2"
              >
                <MapPin className="h-4 w-4" />
                Відкрити в Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="h-80 sm:h-96">
              <GoogleMap className="w-full h-full" height="100%" />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 lg:mt-20">
          <FAQ />
        </div>
      </div>
    </div>
  )
}

export default Contact
