'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import MicroFeedback from '@/components/MicroFeedback'
import { useEffect, useMemo, useState } from 'react'
import { createICSEvent, downloadICS } from '@/utils/calendar'
import { CalendarPlus } from 'lucide-react'
import ReminderSettings from '@/components/ReminderSettings'

type BookingDetails = {
  id: string
  service: string
  date: string
  time: string
  name: string
  created: string
}

export default function BookingSuccess() {
  const params = useSearchParams()
  const ref = params.get('ref')
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem('last_booking')
      if (saved) {
        const parsed = JSON.parse(saved) as BookingDetails
        setBookingDetails(parsed)
      }
    } catch {}
  }, [])

  const canCreateEvent = useMemo(
    () => Boolean(bookingDetails?.date && bookingDetails?.time && ref),
    [bookingDetails, ref]
  )

  const handleAddToCalendar = () => {
    if (!bookingDetails || !ref) return
    // Parse the time from the booking details
    const startLocal = new Date(bookingDetails.date + 'T' + bookingDetails.time)
    // Default 30 minutes duration
    const endLocal = new Date(startLocal.getTime() + 30 * 60 * 1000)
    const ics = createICSEvent({
      uid: ref,
      title: `Візит: ${bookingDetails.service}`,
      description:
        `Запис №${ref}. Пацієнт: ${bookingDetails.name || ''}`.trim(),
      location: 'Dental Studio',
      start: startLocal,
      end: endLocal,
      url: window.location.href,
    })
    downloadICS(`booking-${ref}.ics`, ics)
  }

  return (
    <div className="section-padding">
      <div className="container-custom max-w-3xl text-center">
        <h1 className="text-foreground mb-4">
          Дякуємо! Запис створено
        </h1>
        <p className="text-muted-foreground mb-6">
          Ми зв'яжемося з вами для підтвердження найближчим часом.
        </p>

        {/* Appointment details */}
        <div className="card-elevated p-6 mb-6 mx-auto max-w-md text-left">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Деталі запису
          </h2>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground flex items-center gap-2">
              Номер запису:{' '}
              <span className="font-mono font-medium text-foreground">{ref}</span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ref || '')
                  } catch {}
                }}
                className="text-xs px-2 py-0.5 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Копіювати
              </button>
            </p>
            {bookingDetails && (
              <>
                <p className="text-muted-foreground">
                  Послуга:{' '}
                  <span className="font-medium text-foreground">
                    {bookingDetails.service}
                  </span>
                </p>
                {bookingDetails.date && (
                  <p className="text-muted-foreground">
                    Дата:{' '}
                    <span className="font-medium text-foreground">
                      {bookingDetails.date}
                    </span>
                  </p>
                )}
                {bookingDetails.time && (
                  <p className="text-muted-foreground">
                    Час:{' '}
                    <span className="font-medium text-foreground">
                      {bookingDetails.time}
                    </span>
                  </p>
                )}
                {bookingDetails.name && (
                  <p className="text-muted-foreground">
                    Ім'я:{' '}
                    <span className="font-medium text-foreground">
                      {bookingDetails.name}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 mb-6">
          <MicroFeedback form="appointment" refId={ref || undefined} />

          <div className="w-full max-w-md">
            <ReminderSettings />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="btn-primary"
          >
            На головну
          </Link>
          <Link
            href="/booking"
            className="btn-secondary"
          >
            Створити ще один запис
          </Link>
          {canCreateEvent && (
            <button
              onClick={handleAddToCalendar}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <CalendarPlus className="h-5 w-5" /> Додати в календар
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
