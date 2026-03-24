import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDateTime } from './dateFormatter'

describe('dateFormatter', () => {
  const testDate = new Date('2026-03-15T14:30:00')

  describe('formatDate', () => {
    it('formats date in DD.MM.YYYY Ukrainian locale', () => {
      const result = formatDate(testDate)
      expect(result).toContain('2026')
      expect(result).toContain('03')
      expect(result).toContain('15')
    })
  })

  describe('formatTime', () => {
    it('formats time in HH:MM 24-hour format', () => {
      const result = formatTime(testDate)
      expect(result).toContain('14')
      expect(result).toContain('30')
    })
  })

  describe('formatDateTime', () => {
    it('combines date and time', () => {
      const result = formatDateTime(testDate)
      expect(result).toContain('2026')
      expect(result).toContain('14')
      expect(result).toContain('30')
    })
  })
})
