/**
 * Форматування дати в українському форматі
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const formats = {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    } as Intl.DateTimeFormatOptions,
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    } as Intl.DateTimeFormatOptions,
    full: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    } as Intl.DateTimeFormatOptions,
  }

  return new Intl.DateTimeFormat('uk-UA', formats[format]).format(d)
}

/**
 * Форматування часу
 */
export function formatTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  }

  return new Intl.DateTimeFormat('uk-UA', options).format(d)
}

/**
 * Форматування дати та часу разом
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date, 'short')} о ${formatTime(date)}`
}

/**
 * Форматування валюти (гривні)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'UAH'
): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Форматування чисел з розділювачами
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('uk-UA').format(num)
}

/**
 * Відносний час ("2 години тому", "вчора")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'щойно'
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${getMinutesWord(minutes)} тому`
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${getHoursWord(hours)} тому`
  }

  if (diffInSeconds < 172800) {
    return 'вчора'
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${getDaysWord(days)} тому`
  }

  return formatDate(d, 'short')
}

/**
 * Допоміжна функція для правильного відмінювання слова "хвилина"
 */
function getMinutesWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'хвилину'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
    return 'хвилини'
  return 'хвилин'
}

/**
 * Допоміжна функція для правильного відмінювання слова "година"
 */
function getHoursWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'годину'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
    return 'години'
  return 'годин'
}

/**
 * Допоміжна функція для правильного відмінювання слова "день"
 */
function getDaysWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
    return 'дні'
  return 'днів'
}

/**
 * Скорочення тексту з додаванням "..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Capitalize перша літера
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
