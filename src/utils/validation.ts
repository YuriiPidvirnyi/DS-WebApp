/**
 * Перевірка чи поле порожнє
 */
export function isEmpty(value: string): boolean {
  return !value || value.trim().length === 0
}

/**
 * Перевірка мінімальної довжини
 */
export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

/**
 * Перевірка максимальної довжини
 */
export function maxLength(value: string, max: number): boolean {
  return value.trim().length <= max
}

/**
 * Перевірка email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Перевірка українського номера телефону
 * Підтримує формати: +380XXXXXXXXX, 380XXXXXXXXX, 0XXXXXXXXX
 */
export function isValidUkrainianPhone(phone: string): boolean {
  // Видаляємо всі пробіли, дефіси, дужки
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  const patterns = [
    /^\+380\d{9}$/, // +380XXXXXXXXX
    /^380\d{9}$/, // 380XXXXXXXXX
    /^0\d{9}$/, // 0XXXXXXXXX
  ]

  return patterns.some(pattern => pattern.test(cleaned))
}

/**
 * Форматування українського номера телефону
 */
export function formatUkrainianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  // Якщо починається з 0, конвертуємо в +380
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+380 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  
  // Якщо починається з 380
  if (cleaned.startsWith('380') && cleaned.length === 12) {
    return `+380 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`
  }
  
  // Якщо починається з +380
  if (cleaned.startsWith('+380') && cleaned.length === 13) {
    return `+380 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`
  }
  
  return phone
}

/**
 * Валідація повного імені (мінімум 2 слова)
 */
export function isValidFullName(name: string): boolean {
  const trimmed = name.trim()
  const words = trimmed.split(/\s+/)
  return words.length >= 2 && words.every(word => word.length >= 2)
}

/**
 * Готові валідатори для використання в формах
 */
export const validators = {
  required: (value: string, fieldName: string = 'Поле'): string | undefined => {
    return isEmpty(value) ? `${fieldName} є обов'язковим` : undefined
  },

  email: (value: string): string | undefined => {
    if (isEmpty(value)) return undefined
    return !isValidEmail(value) ? 'Введіть коректну email адресу' : undefined
  },

  phone: (value: string): string | undefined => {
    if (isEmpty(value)) return undefined
    return !isValidUkrainianPhone(value)
      ? 'Введіть коректний номер телефону (наприклад, +380 XX XXX XX XX)'
      : undefined
  },

  fullName: (value: string): string | undefined => {
    if (isEmpty(value)) return undefined
    return !isValidFullName(value)
      ? 'Введіть ім\'я та прізвище'
      : undefined
  },

  minLength: (min: number) => (value: string, fieldName: string = 'Поле'): string | undefined => {
    if (isEmpty(value)) return undefined
    return !minLength(value, min)
      ? `${fieldName} повинно містити мінімум ${min} символів`
      : undefined
  },

  maxLength: (max: number) => (value: string, fieldName: string = 'Поле'): string | undefined => {
    if (isEmpty(value)) return undefined
    return !maxLength(value, max)
      ? `${fieldName} повинно містити максимум ${max} символів`
      : undefined
  },
}

/**
 * Комбінує декілька валідаторів
 */
export function combineValidators(
  ...validatorFns: Array<(value: string) => string | undefined>
) {
  return (value: string): string | undefined => {
    for (const validator of validatorFns) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}
