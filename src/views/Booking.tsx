'use client'

import { Phone, Clock, MapPin, CheckCircle2 } from 'lucide-react'
import BookingForm from '@/components/BookingForm'
import { CONTACT_INFO } from '@/utils/constants'

const benefits = [
  'Безкоштовна первинна консультація',
  'Підтвердження протягом 30 хвилин',
  'Нагадування за день до візиту',
  'Можливість перенесення запису',
]

export default function BookingPage() {
  return (
    <section className="section-padding bg-gradient-subtle">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-wider uppercase mb-4">
            Онлайн запис
          </span>
          <h1 className="mb-4">Запис на прийом</h1>
          <p className="text-responsive-base max-w-2xl mx-auto">
            Оберіть зручний час і ми підтвердимо ваш запис найближчим часом. 
            Безкоштовна консультація для нових пацієнтів.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Sidebar info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Benefits card */}
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Що ви отримаєте</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact card */}
            <div className="card-elevated p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Або зателефонуйте</h3>
              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Phone className="h-5 w-5" />
                {CONTACT_INFO.phone}
              </a>
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{CONTACT_INFO.workingHours.weekdays}</p>
                    <p>{CONTACT_INFO.workingHours.saturday}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{CONTACT_INFO.address.full}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:col-span-2">
            <div className="card-elevated p-6 sm:p-8">
              <BookingForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
