'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import MicroFeedback from '@/components/MicroFeedback'
import { useEffect, useMemo, useState } from 'react'
import { createICSEvent, downloadICS } from '@/utils/calendar'
import { CalendarPlus, CreditCard } from 'lucide-react'
import ReminderSettings from '@/components/ReminderSettings'
import { useTranslation } from 'react-i18next'

type PaymentConfig = {
  mode: 'none' | 'deposit' | 'full'
  amountKopecks: number
}

type BookingDetails = {
  id: string
  service: string
  date: string
  time: string
  name: string
  created: string
  paymentConfig?: PaymentConfig
}

function readLastBooking(): BookingDetails | null {
  try {
    const saved = localStorage.getItem('last_booking')
    if (!saved) return null
    return JSON.parse(saved) as BookingDetails
  } catch {
    return null
  }
}

export default function BookingSuccess() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const router = useRouter()
  const ref = params.get('ref')
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  )
  const [isPaying, setIsPaying] = useState(false)

  // Require ?ref=… or a recent last_booking; otherwise redirect to /booking
  useEffect(() => {
    const stored = readLastBooking()

    if (!ref) {
      if (stored?.id) {
        router.replace(`/booking/success?ref=${encodeURIComponent(stored.id)}`)
        return
      }
      router.replace('/booking')
      return
    }

    if (stored?.id === ref) {
      setBookingDetails(stored)
      return
    }

    void fetch(`/api/appointments/${ref}/summary`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.data) setBookingDetails(json.data)
      })
      .catch(() => {})
  }, [ref, router])

  const canCreateEvent = useMemo(
    () => Boolean(bookingDetails?.date && bookingDetails?.time && ref),
    [bookingDetails, ref]
  )

  const handlePay = async () => {
    if (!ref || !bookingDetails?.paymentConfig) return
    setIsPaying(true)
    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          appointmentId: ref,
          amountKopecks: bookingDetails.paymentConfig.amountKopecks,
          description: bookingDetails.service,
          paymentType: bookingDetails.paymentConfig.mode,
        }),
      })
      const json = (await res.json()) as {
        success: boolean
        data?: { invoiceId: string; pageUrl: string }
      }
      if (json.success && json.data) {
        sessionStorage.setItem(
          'pending_payment_invoice_id',
          json.data.invoiceId
        )
        router.push(json.data.pageUrl)
      }
    } finally {
      setIsPaying(false)
    }
  }

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
        <h1 className="text-4xl font-bold text-dental-dark mb-4">
          {t('booking.successPage.title')}
        </h1>
        <p className="text-dental-text mb-6">
          {t('booking.successPage.subtitle')}
        </p>

        {/* Appointment details */}
        <div className="bg-white border border-dental-secondary-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
          <h2 className="text-lg font-medium text-dental-dark mb-3">
            {t('booking.successPage.detailsTitle')}
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-dental-muted flex items-center gap-2">
              {t('booking.successPage.bookingNumber')}:{' '}
              <span className="font-mono font-medium text-dental-dark">
                {ref}
              </span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ref || '')
                  } catch {}
                }}
                className="text-xs px-2 py-0.5 border border-dental-secondary-300 rounded hover:bg-dental-secondary-50"
                aria-label={t('booking.successPage.copy')}
              >
                {t('booking.successPage.copy')}
              </button>
            </p>
            {bookingDetails && (
              <>
                <p className="text-dental-muted">
                  {t('booking.successPage.service')}:{' '}
                  <span className="font-medium text-dental-dark">
                    {bookingDetails.service}
                  </span>
                </p>
                {bookingDetails.date && (
                  <p className="text-dental-muted">
                    {t('booking.successPage.date')}:{' '}
                    <span className="font-medium text-dental-dark">
                      {bookingDetails.date}
                    </span>
                  </p>
                )}
                {bookingDetails.time && (
                  <p className="text-dental-muted">
                    {t('booking.successPage.time')}:{' '}
                    <span className="font-medium text-dental-dark">
                      {bookingDetails.time}
                    </span>
                  </p>
                )}
                {bookingDetails.name && (
                  <p className="text-dental-muted">
                    {t('booking.successPage.name')}:{' '}
                    <span className="font-medium text-dental-dark">
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
          {bookingDetails?.paymentConfig &&
            bookingDetails.paymentConfig.mode !== 'none' && (
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="px-5 py-2 rounded-lg bg-dental-teal text-white inline-flex items-center gap-2 disabled:opacity-60"
              >
                <CreditCard className="h-5 w-5" />
                {isPaying
                  ? t('booking.successPage.payingDeposit')
                  : t('booking.successPage.payDeposit')}
              </button>
            )}
          <Link
            href="/"
            className="px-5 py-2 rounded-lg bg-dental-secondary-100 text-dental-dark"
          >
            {t('booking.successPage.goHome')}
          </Link>
          <Link
            href="/booking"
            className="px-5 py-2 rounded-lg bg-dental-secondary-100 text-dental-dark"
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
