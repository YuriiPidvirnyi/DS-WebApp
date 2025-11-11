/**
 * Utility functions for formatting dates in a consistent way across the application
 */

// Format date to DD.MM.YYYY
export function formatDate(date: Date): string {
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Format time to HH:MM
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Format date and time together
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

// Get relative time description (e.g., "2 години тому", "за 3 дні")
export function getRelativeTimeString(date: Date, lang = 'uk'): string {
  // Calculate the time difference in milliseconds
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const absDiffSec = Math.abs(diffSec)

  // Define time units in seconds
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  // Format strings based on language
  const units = {
    uk: {
      future: 'за',
      past: 'тому',
      second: ['секунду', 'секунди', 'секунд'],
      minute: ['хвилину', 'хвилини', 'хвилин'],
      hour: ['годину', 'години', 'годин'],
      day: ['день', 'дні', 'днів'],
      week: ['тиждень', 'тижні', 'тижнів'],
      month: ['місяць', 'місяці', 'місяців'],
      year: ['рік', 'роки', 'років'],
    },
    en: {
      future: 'in',
      past: 'ago',
      second: ['second', 'seconds'],
      minute: ['minute', 'minutes'],
      hour: ['hour', 'hours'],
      day: ['day', 'days'],
      week: ['week', 'weeks'],
      month: ['month', 'months'],
      year: ['year', 'years'],
    },
  }

  const isUkrainian = lang === 'uk'

  // Get correct plural form for Ukrainian
  const getUkrainianForm = (number: number, forms: string[]) => {
    const absNumber = Math.abs(number)
    if (absNumber % 10 === 1 && absNumber % 100 !== 11) {
      return forms[0]
    } else if (
      [2, 3, 4].includes(absNumber % 10) &&
      ![12, 13, 14].includes(absNumber % 100)
    ) {
      return forms[1]
    } else {
      return forms[2]
    }
  }

  // Get English plural form
  const getEnglishForm = (number: number, forms: string[]) => {
    return Math.abs(number) === 1 ? forms[0] : forms[1]
  }

  const selectedLang = isUkrainian ? units.uk : units.en
  const getForm = isUkrainian ? getUkrainianForm : getEnglishForm

  // Determine appropriate time unit
  let value: number
  let unit: string

  if (absDiffSec < minute) {
    value = absDiffSec
    unit = getForm(value, selectedLang.second)
  } else if (absDiffSec < hour) {
    value = Math.floor(absDiffSec / minute)
    unit = getForm(value, selectedLang.minute)
  } else if (absDiffSec < day) {
    value = Math.floor(absDiffSec / hour)
    unit = getForm(value, selectedLang.hour)
  } else if (absDiffSec < week) {
    value = Math.floor(absDiffSec / day)
    unit = getForm(value, selectedLang.day)
  } else if (absDiffSec < month) {
    value = Math.floor(absDiffSec / week)
    unit = getForm(value, selectedLang.week)
  } else if (absDiffSec < year) {
    value = Math.floor(absDiffSec / month)
    unit = getForm(value, selectedLang.month)
  } else {
    value = Math.floor(absDiffSec / year)
    unit = getForm(value, selectedLang.year)
  }

  // Format the output
  const direction = diffSec >= 0 ? selectedLang.future : selectedLang.past

  if (isUkrainian) {
    return diffSec >= 0
      ? `${direction} ${value} ${unit}`
      : `${value} ${unit} ${direction}`
  } else {
    return diffSec >= 0
      ? `${direction} ${value} ${unit}`
      : `${value} ${unit} ${direction}`
  }
}
