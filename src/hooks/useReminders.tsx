'use client'

import { useEffect, useCallback } from 'react'
import { checkDueReminders, ScheduledReminder } from '@/services/reminders'
import { showInfo } from '@/utils/toast'
import { createICSEvent, downloadICS } from '@/utils/calendar'
import toast from 'react-hot-toast'
import i18n from '@/i18n/config'

// Client-side hooks to check for reminders and display notifications
export function useReminders() {
  const checkReminders = useCallback(() => {
    try {
      // Check for reminders that are due
      const dueReminders = checkDueReminders()

      // Show notifications for any due reminders
      dueReminders.forEach(reminder => {
        if (reminder.type === 'day-before') {
          showDayBeforeReminder(reminder)
        } else if (reminder.type === 'hour-before') {
          showHourBeforeReminder(reminder)
        }
      })

      return dueReminders.length
    } catch (error) {
      console.error('Error checking reminders:', error)
      return 0
    }
  }, [])

  // Run reminder check on load (deferred) and every 5 minutes.
  // Initial check deferred via requestIdleCallback to avoid blocking
  // the main thread during hydration.
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => checkReminders())
      const interval = setInterval(checkReminders, 5 * 60 * 1000)
      return () => {
        cancelIdleCallback(id)
        clearInterval(interval)
      }
    } else {
      const timeout = setTimeout(() => checkReminders(), 3000)
      const interval = setInterval(checkReminders, 5 * 60 * 1000)
      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
      }
    }
  }, [checkReminders])

  return { checkReminders }
}

// Functions to display reminder notifications
function showDayBeforeReminder(reminder: ScheduledReminder) {
  // Try to get appointment details from localStorage
  try {
    const bookingKey = 'last_booking'
    const lastBookingJson = localStorage.getItem(bookingKey)
    if (lastBookingJson) {
      const booking = JSON.parse(lastBookingJson)

      // Only show if the appointment IDs match
      if (booking.id === reminder.appointmentId) {
        // Show notification
        const id = showInfo(
          i18n.t('reminderSettings.notifications.dayBefore', {
            time: booking.time,
            service: booking.service,
          })
        )

        // Remove notification after 10 seconds
        setTimeout(() => {
          toast.dismiss(id)
        }, 10000)
      }
    }
  } catch (error) {
    console.error('Error processing reminder:', error)
  }
}

function showHourBeforeReminder(reminder: ScheduledReminder) {
  // Similar to day before, but with different messaging
  try {
    const bookingKey = 'last_booking'
    const lastBookingJson = localStorage.getItem(bookingKey)
    if (lastBookingJson) {
      const booking = JSON.parse(lastBookingJson)

      // Only show if the appointment IDs match
      if (booking.id === reminder.appointmentId) {
        // Show notification with offer to download calendar event
        const id = showInfo(
          i18n.t('reminderSettings.notifications.hourBefore', {
            time: booking.time,
          })
        )

        // Optionally offer calendar download
        offerCalendarDownload(booking)

        // Remove notification after 15 seconds
        setTimeout(() => {
          toast.dismiss(id)
        }, 15000)
      }
    }
  } catch (error) {
    console.error('Error processing reminder:', error)
  }
}

interface BookingData {
  id: string
  date: string
  time: string
  service: string
  [key: string]: unknown
}

function offerCalendarDownload(booking: BookingData) {
  // Only proceed if we have the required data
  if (!booking.date || !booking.time || !booking.id) return

  try {
    // Create start and end dates (assuming 30 min appointment)
    const startLocal = new Date(`${booking.date}T${booking.time}`)
    const endLocal = new Date(startLocal.getTime() + 30 * 60 * 1000)

    // Create ICS event
    const ics = createICSEvent({
      uid: booking.id,
      title: i18n.t('reminderSettings.calendar.title', {
        service: booking.service,
      }),
      description: i18n.t('reminderSettings.calendar.description', {
        id: booking.id,
      }),
      location: i18n.t('reminderSettings.calendar.location'),
      start: startLocal,
      end: endLocal,
      url: window.location.origin,
    })

    // Show info toast with download offer
    toast(
      (t: { id: string }) => (
        <div onClick={() => toast.dismiss(t.id)}>
          <span>{i18n.t('reminderSettings.notifications.downloadPrompt')}</span>
          <button
            onClick={e => {
              e.stopPropagation()
              downloadICS(`appointment-${booking.id}.ics`, ics)
              toast.dismiss(t.id)
            }}
            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
          >
            {i18n.t('feedback.ariaYes')}
          </button>
        </div>
      ),
      {
        duration: 10000,
        style: {
          borderLeft: '4px solid #3b82f6',
        },
      }
    )
  } catch (error) {
    console.error('Error offering calendar download:', error)
  }
}
