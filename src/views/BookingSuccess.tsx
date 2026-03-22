'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import MicroFeedback from '@/components/MicroFeedback'
import { useEffect, useMemo, useState } from 'react'
import { createICSEvent, downloadICS } from '@/utils/calendar'
import { CalendarPlus } from 'lucide-react'
import ReminderSettings from '@/components/ReminderSettings'
import { useTranslation } from 'react-i18next'

type BookingDetails = {
  id: string
  service: string
  date: string
  time: string
  name: string
  created: string
}

export default function BookingSuccess() {
  const { t } = useTranslation()
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
        return
      }
    } catch {}

    if (!ref) return
    fetch(`/api/appointments/${ref}/summary`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.data) setBookingDetails(json.data)
      })
      .catch(() => {})
  }, [ref])

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
      title: t('booking.successPage.calendarTitle', {
        service: bookingDetails.service,
      }),
      description: t('booking.successPage.calendarDescription', {
        ref,
        name: bookingDetails.name || '',
      }).trim(),
      location: t('booking.successPage.calendarLocation'),
      start: startLocal,
      end: endLocal,
      url: window.location.href,
    })
    downloadICS(`booking-${ref}.ics`, ics)
  }

  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('booking.successPage.title')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('booking.successPage.subtitle')}
        </p>

        {/* Appointment details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {t('booking.successPage.detailsTitle')}
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 flex items-center gap-2">
              {t('booking.successPage.bookingNumber')}:{' '}
              <span className="font-mono font-medium text-gray-900">{ref}</span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ref || '')
                  } catch {}
                }}
                className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50"
                aria-label={t('booking.successPage.copy')}
              >
                {t('booking.successPage.copy')}
              </button>
            </p>
            {bookingDetails && (
              <>
                <p className="text-gray-500">
                  {t('booking.successPage.service')}:{' '}
                  <span className="font-medium text-gray-900">
                    {bookingDetails.service}
                  </span>
                </p>
                {bookingDetails.date && (
                  <p className="text-gray-500">
                    {t('booking.successPage.date')}:{' '}
                    <span className="font-medium text-gray-900">
                      {bookingDetails.date}
                    </span>
                  </p>
                )}
                {bookingDetails.time && (
                  <p className="text-gray-500">
                    {t('booking.successPage.time')}:{' '}
                    <span className="font-medium text-gray-900">
                      {bookingDetails.time}
                    </span>
                  </p>
                )}
                {bookingDetails.name && (
                  <p className="text-gray-500">
                    {t('booking.successPage.name')}:{' '}
                    <span className="font-medium text-gray-900">
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
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2 rounded-lg bg-dental-teal text-white"
          >
            {t('booking.successPage.goHome')}
          </Link>
          <Link
            href="/booking"
            className="px-5 py-2 rounded-lg bg-gray-100 text-gray-800"
          >
            {t('booking.successPage.createAnother')}
          </Link>
          {canCreateEvent && (
            <button
              onClick={handleAddToCalendar}
              className="px-5 py-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-2"
              aria-label={t('booking.successPage.addToCalendar')}
            >
              <CalendarPlus className="h-5 w-5" />{' '}
              {t('booking.successPage.addToCalendar')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
