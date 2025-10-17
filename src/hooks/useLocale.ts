import { useMemo } from 'react'
import ukLocale from '../locales/uk.json'

type DeepKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string 
      ? T[K] extends object 
        ? `${K}.${DeepKeyOf<T[K]>}`
        : K 
      : never 
    }[keyof T]
  : never

type LocaleKey = DeepKeyOf<typeof ukLocale>

/**
 * Hook для використання української локалізації
 * @returns об'єкт з функцією t для отримання перекладів
 */
export const useLocale = () => {
  const locale = useMemo(() => ukLocale, [])

  /**
   * Функція для отримання перекладу за ключем
   * @param key - ключ перекладу в форматі 'category.subcategory.key'
   * @param params - параметри для інтерполяції (необов'язково)
   * @returns перекладений текст
   */
  const t = (key: LocaleKey, params?: Record<string, string | number>): string => {
    try {
      const keys = key.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = locale

      // Проходимо по вкладених ключах
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          console.warn(`Translation key "${key}" not found`)
          return key // Повертаємо ключ як fallback
        }
      }

      if (typeof value !== 'string') {
        console.warn(`Translation key "${key}" does not resolve to a string`)
        return key
      }

      // Інтерполяція параметрів
      if (params) {
        return Object.entries(params).reduce(
          (text, [paramKey, paramValue]) => 
            text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
          value
        )
      }

      return value
    } catch (error) {
      console.error(`Error getting translation for key "${key}":`, error)
      return key
    }
  }

  /**
   * Функція для отримання масиву перекладів
   * @param key - ключ який вказує на масив
   * @returns масив перекладених рядків
   */
  const tArray = (key: LocaleKey): string[] => {
    try {
      const keys = key.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = locale

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          console.warn(`Translation key "${key}" not found`)
          return []
        }
      }

      if (Array.isArray(value)) {
        return value
      } else {
        console.warn(`Translation key "${key}" does not resolve to an array`)
        return []
      }
    } catch (error) {
      console.error(`Error getting translation array for key "${key}":`, error)
      return []
    }
  }

  /**
   * Функція для форматування дати українською мовою
   * @param date - дата для форматування
   * @returns відформатована дата
   */
  const formatDate = (date: Date): string => {
    const dateFormat = locale.dateFormat
    return new Intl.DateTimeFormat(
      dateFormat.locale, 
      dateFormat.options as Intl.DateTimeFormatOptions
    ).format(date)
  }

  /**
   * Функція для отримання метаданих
   * @returns об'єкт з метаданими
   */
  const getMeta = () => locale.meta

  /**
   * Функція для отримання навігаційних елементів
   * @returns об'єкт з навігацією
   */
  const getNavigation = () => locale.navigation

  return {
    t,
    tArray,
    formatDate,
    getMeta,
    getNavigation,
    locale
  }
}

export default useLocale