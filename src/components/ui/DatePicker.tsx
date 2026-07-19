'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    )
    onChange(formatDate(newDate))
    setIsOpen(false)
  }

  const previousMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1)
    )
  }

  const nextMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1)
    )
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const daysInMonth = getDaysInMonth(displayMonth)
  const firstDayOfMonth = getFirstDayOfMonth(displayMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const displayValue = value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : ''

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-dental-secondary-200 rounded-xl focus:ring-2 focus:ring-dental-primary-600 focus:border-transparent transition-all cursor-pointer"
      />

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right bg-white rounded-2xl border border-dental-secondary-200 shadow-xl p-6">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-dental-primary hover:bg-opacity-10 rounded-lg transition-colors text-dental-primary-ink"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="font-semibold text-dental-dark">
                {monthNames[displayMonth.getMonth()]}{' '}
                {displayMonth.getFullYear()}
              </h3>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-dental-primary hover:bg-opacity-10 rounded-lg transition-colors text-dental-primary-ink"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-dental-muted py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty days for month start offset */}
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {days.map(day => {
              const date = new Date(
                displayMonth.getFullYear(),
                displayMonth.getMonth(),
                day
              )
              const isSelected = value && formatDate(date) === value
              const isToday = formatDate(date) === formatDate(new Date())

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-dental-primary-600 text-white shadow-md'
                      : isToday
                        ? 'bg-dental-primary bg-opacity-20 text-dental-primary-ink font-semibold'
                        : 'text-dental-text hover:bg-dental-primary hover:bg-opacity-10'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-dental-secondary-100">
            <button
              onClick={() => {
                const today = new Date()
                onChange(formatDate(today))
                setIsOpen(false)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-dental-primary-ink hover:bg-dental-primary hover:bg-opacity-10 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-dental-muted hover:bg-dental-secondary-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
