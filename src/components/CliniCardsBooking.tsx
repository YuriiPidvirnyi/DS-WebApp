import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { getCliniCardsApi, type Schedule, type TimeSlot, type Appointment } from '../services/clinicardsApi'
import { monitoring } from '../services/monitoring'

interface BookingFormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
}

/**
 * Online booking component with CliniCards integration
 */
export const CliniCardsBooking: React.FC = () => {
  const [step, setStep] = useState<'doctor' | 'date' | 'time' | 'info' | 'confirm'

>('doctor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Doctor selection
  const [doctors, setDoctors] = useState<Schedule[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)

  // Date selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // Time selection
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Patient info
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
  })

  // Load doctors schedule on mount
  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    setLoading(true)
    setError(null)

    try {
      const api = getCliniCardsApi()
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await api.getSchedule({ startDate, endDate })

      if (response.success && response.data) {
        setDoctors(response.data)
        monitoring.trackMetric('clinicards.doctors_loaded', response.data.length)
      } else {
        throw new Error(response.error || 'Failed to load doctors')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      monitoring.trackError(errorMessage, 'error', { context: 'load_doctors' })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    setLoading(true)
    setError(null)

    try {
      const api = getCliniCardsApi()
      const response = await api.getAvailableSlots({ doctorId, date })

      if (response.success && response.data) {
        setTimeSlots(response.data)
        monitoring.trackMetric('clinicards.slots_loaded', response.data.length)
      } else {
        throw new Error(response.error || 'Failed to load time slots')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      monitoring.trackError(errorMessage, 'error', { context: 'load_slots' })
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId)
    
    // Extract available dates for this doctor
    const doctor = doctors.find(d => d.doctorId === doctorId)
    if (doctor) {
      // Get next 30 days with available slots
      const dates: string[] = []
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date.toISOString().split('T')[0])
      }
      setAvailableDates(dates)
    }
    
    setStep('date')
    monitoring.trackCount('clinicards.doctor_selected')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor, date)
    }
    setStep('time')
    monitoring.trackCount('clinicards.date_selected')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('info')
    monitoring.trackCount('clinicards.time_selected')
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError('Please complete all booking steps')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const api = getCliniCardsApi()

      // Check if patient exists
      let patientId: string
      const existingPatient = await api.getPatientByPhone(formData.phone)

      if (existingPatient.success && existingPatient.data) {
        // Patient exists, use existing ID
        patientId = existingPatient.data.id!
        monitoring.trackCount('clinicards.patient_found')
      } else {
        // Create new patient
        const newPatient = await api.createPatient({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
        })

        if (!newPatient.success || !newPatient.data) {
          throw new Error('Failed to create patient')
        }

        patientId = newPatient.data.id
        monitoring.trackCount('clinicards.patient_created')
      }

      // Create appointment
      const appointment: Appointment = {
        patientId,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        duration: 30, // Default 30 min
        status: 'scheduled',
        notes: formData.notes,
      }

      const response = await api.createAppointment(appointment)

      if (response.success) {
        setSuccess(true)
        setStep('confirm')
        monitoring.trackCount('clinicards.appointment_created')
        monitoring.trackMetric('clinicards.booking_success', 1)
      } else {
        throw new Error(response.error || 'Failed to create appointment')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Booking failed'
      setError(errorMessage)
      monitoring.trackError(errorMessage, 'error', { context: 'create_appointment' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('uk-UA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const selectedDoctorInfo = doctors.find(d => d.doctorId === selectedDoctor)

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Запис підтверджено!
          </h2>
          <p className="text-green-700 mb-6">
            Ваш візит успішно заброньовано. Очікуйте SMS-підтвердження.
          </p>
          
          <div className="bg-white rounded-lg p-6 text-left mb-6">
            <h3 className="font-bold mb-4">Деталі запису:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Лікар:</strong> {selectedDoctorInfo?.doctorName}</p>
              <p><strong>Спеціалізація:</strong> {selectedDoctorInfo?.specialization}</p>
              <p><strong>Дата:</strong> {selectedDate && formatDate(selectedDate)}</p>
              <p><strong>Час:</strong> {selectedTime}</p>
              <p><strong>Пацієнт:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Телефон:</strong> {formData.phone}</p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Записатися ще раз
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Progress Steps */}
        <div className="border-b p-6">
          <div className="flex justify-between items-center">
            {['doctor', 'date', 'time', 'info', 'confirm'].map((s, i) => (
              <div
                key={s}
                className={`flex items-center ${i < 4 ? 'flex-1' : ''}`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${step === s ? 'bg-primary text-white' : 
                    ['doctor', 'date', 'time', 'info'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'}
                `}>
                  {i + 1}
                </div>
                {i < 4 && <div className="flex-1 h-1 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Select Doctor */}
          {step === 'doctor' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Оберіть лікаря</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Завантаження...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map(doctor => (
                    <button
                      key={doctor.doctorId}
                      onClick={() => handleDoctorSelect(doctor.doctorId)}
                      className="p-6 border-2 rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{doctor.doctorName}</h3>
                          <p className="text-gray-600 text-sm">{doctor.specialization}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === 'date' && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Оберіть дату</h2>
              <p className="text-gray-600 mb-6">
                Лікар: <strong>{selectedDoctorInfo?.doctorName}</strong>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableDates.slice(0, 14).map(date => (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className="p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">
                      {new Date(date).toLocaleDateString('uk-UA', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(date).toLocaleDateString('uk-UA', { weekday: 'short' })}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('doctor')}
                className="mt-6 px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                ← Назад
              </button>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === 'time' && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Оберіть час</h2>
              <p className="text-gray-600 mb-6">
                {selectedDate && formatDate(selectedDate)}
              </p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {timeSlots.filter(slot => slot.available).map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className="p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="font-medium">{slot.time}</p>
                      </button>
                    ))}
                  </div>

                  {timeSlots.filter(slot => slot.available).length === 0 && (
                    <div className="text-center py-12 text-gray-600">
                      На цю дату немає вільних слотів. Оберіть іншу дату.
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => setStep('date')}
                className="mt-6 px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                ← Назад
              </button>
            </div>
          )}

          {/* Step 4: Patient Info */}
          {step === 'info' && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-2xl font-bold mb-6">Ваші дані</h2>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ім'я *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Прізвище *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Телефон *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+380..."
                      required
                      className="w-full pl-11 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full pl-11 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Коментар</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('time')}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ← Назад
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Обробка...' : 'Підтвердити запис'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
