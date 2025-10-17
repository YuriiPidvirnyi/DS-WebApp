import { useState, useEffect } from 'react'
import { Bell, BellOff, Trash, CalendarPlus } from 'lucide-react'
import { 
  getLocalReminders, 
  removeLocalReminder, 
  updateReminderPreference,
  type ReminderPreference,
  type ScheduledReminder
} from '@/services/reminders'
import { createICSEvent, downloadICS } from '@/utils/calendar'
import { formatDate, formatTime } from '@/utils/dateFormatter'
import { Button } from './ui'
import { withToast } from '@/utils/toast'

export default function ReminderSettings() {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load reminders
  useEffect(() => {
    if (showSettings) {
      const savedReminders = getLocalReminders()
      setReminders(savedReminders)
    }
  }, [showSettings])

  // Format reminder time
  const formatReminderTime = (reminder: ScheduledReminder) => {
    try {
      const date = new Date(reminder.sendAt)
      return `${formatDate(date)}, ${formatTime(date)}`
    } catch {
      return 'Невідомий час'
    }
  }

  // Handle deletion of reminders
  const handleDelete = async (reminder: ScheduledReminder) => {
    setLoading(true)
    try {
      await withToast(
        async () => {
          removeLocalReminder(reminder.appointmentId)
          // Update UI
          setReminders(prev => prev.filter(r => r.id !== reminder.id))
          return { success: true }
        },
        { 
          successMessage: 'Нагадування успішно видалено',
          errorMessage: 'Не вдалося видалити нагадування'
        }
      )
    } catch (error) {
      console.error('Failed to delete reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle change of reminder preference
  const handlePreferenceChange = async (appointmentId: string, preference: ReminderPreference) => {
    setLoading(true)
    try {
      await withToast(
        async () => {
          const response = await updateReminderPreference(appointmentId, preference)
          if (response.success) {
            // If choosing "none", remove reminders
            if (preference === 'none') {
              removeLocalReminder(appointmentId)
              setReminders(prev => prev.filter(r => r.appointmentId !== appointmentId))
            }
          }
          return response
        },
        { 
          successMessage: 'Налаштування нагадувань оновлено',
          errorMessage: 'Не вдалося оновити налаштування нагадувань'
        }
      )
    } catch (error) {
      console.error('Failed to update preference:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create calendar download for an appointment
  const handleCalendarDownload = (reminder: ScheduledReminder) => {
    try {
      // Try to get appointment details from localStorage
      const bookingKey = 'last_booking'
      const lastBookingJson = localStorage.getItem(bookingKey)
      if (lastBookingJson) {
        const booking = JSON.parse(lastBookingJson)
        
        // Only proceed if it's for this appointment
        if (booking.id === reminder.appointmentId && booking.date && booking.time) {
          const startLocal = new Date(`${booking.date}T${booking.time}`)
          const endLocal = new Date(startLocal.getTime() + 30 * 60 * 1000)
          
          const ics = createICSEvent({
            uid: booking.id,
            title: `Візит: ${booking.service}`,
            description: `Запис №${booking.id}. Не забудьте взяти з собою документи!`,
            location: 'Dental Studio',
            start: startLocal,
            end: endLocal,
            url: window.location.origin,
          })
          
          downloadICS(`appointment-${booking.id}.ics`, ics)
        }
      }
    } catch (error) {
      console.error('Failed to create calendar event:', error)
    }
  }

  // Group reminders by appointment
  const reminderGroups = reminders.reduce<Record<string, ScheduledReminder[]>>((acc, reminder) => {
    const id = reminder.appointmentId
    if (!acc[id]) {
      acc[id] = []
    }
    acc[id].push(reminder)
    return acc
  }, {})

  if (reminders.length === 0 && showSettings) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3">
          <BellOff className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Немає активних нагадувань</h4>
            <p className="text-sm text-gray-600 mt-1">
              Коли ви запишетесь на прийом, ви отримаєте нагадування про нього.
            </p>
            <button
              onClick={() => setShowSettings(false)}
              className="mt-2 text-sm text-dental-teal hover:underline"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!showSettings ? (
        <button
          onClick={() => setShowSettings(true)}
          className="inline-flex items-center gap-2 text-sm text-dental-teal hover:underline"
        >
          <Bell className="h-4 w-4" />
          Налаштування нагадувань
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Налаштування нагадувань</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Закрити
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(reminderGroups).map(([appointmentId, reminders]) => (
              <div key={appointmentId} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Запис #{appointmentId.substring(0, 8)}...</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {reminders.map((reminder) => (
                        <div key={reminder.id} className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                            {reminder.type === 'day-before' ? 'За день' : reminder.type === 'hour-before' ? 'За годину' : 'Інше'}
                          </span>
                          <span>{formatReminderTime(reminder)}</span>
                          {reminder.sent ? (
                            <span className="text-xs text-green-600">Надіслано</span>
                          ) : (
                            <span className="text-xs text-gray-500">Очікується</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCalendarDownload(reminders[0])}
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" /> Календар
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(reminders[0])}
                      disabled={loading}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="text-sm text-gray-600 block mb-1">Отримувати нагадування:</label>
                  <div className="flex gap-2">
                    {(['email', 'sms', 'both', 'none'] as const).map((pref) => (
                      <button
                        key={pref}
                        onClick={() => handlePreferenceChange(appointmentId, pref)}
                        className={`px-2 py-1 text-xs rounded-full border ${
                          reminders[0].contactMethod === pref
                            ? 'bg-dental-teal text-white border-dental-teal'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={loading}
                      >
                        {pref === 'email' ? 'Email' : 
                          pref === 'sms' ? 'SMS' : 
                          pref === 'both' ? 'Email + SMS' : 
                          'Вимкнути'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}