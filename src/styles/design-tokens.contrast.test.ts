import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A11y-гард (Фаза 1, гард №4): контраст AA для семантичних пар токенів.
 * Тест читає globals.css і рахує WCAG-контраст для кожної пари
 * «інк-текст на тінт-фоні» шкали статусів та текстових токенів на білому.
 * Якщо хтось «посвітлить» токен нижче 4.5:1 — CI впаде.
 */

const css = readFileSync(join(__dirname, 'globals.css'), 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`))
  if (!match) throw new Error(`Token --color-${name} not found in globals.css`)
  return match[1]
}

function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map(c => c + c)
          .join('')
      : value
  const [r, g, b] = [0, 2, 4].map(i => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg: string, bg: string): number {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const AA = 4.5

describe('семантична шкала статусів: інк на тінті ≥ AA 4.5:1', () => {
  const tones = ['accent', 'success', 'warning', 'neutral', 'error'] as const
  it.each(tones)('status-%s-700 на status-%s-100', tone => {
    expect(
      contrast(token(`status-${tone}-700`), token(`status-${tone}-100`))
    ).toBeGreaterThanOrEqual(AA)
  })

  it('status-neutral-700 на status-neutral-200 (фон «Скасовано»)', () => {
    expect(
      contrast(token('status-neutral-700'), token('status-neutral-200'))
    ).toBeGreaterThanOrEqual(AA)
  })
})

describe('текстові токени на білому ≥ AA 4.5:1', () => {
  it.each([
    'dental-dark',
    'dental-text',
    'dental-muted',
    'dental-primary-ink',
    'dental-primary-600',
    'dental-primary-700',
    'status-error-700',
  ])('%s на білому', name => {
    expect(contrast(token(name), '#ffffff')).toBeGreaterThanOrEqual(AA)
  })

  it('білий на dental-primary-600 (CTA) ≥ AA', () => {
    expect(
      contrast('#ffffff', token('dental-primary-600'))
    ).toBeGreaterThanOrEqual(AA)
  })

  it('токен dental-text-light лишається лише декоративним (контраст < AA — не для тексту)', () => {
    // Документуємо відомий факт: #8fa3a8 НЕ проходить AA — саме тому підписи
    // мають використовувати dental-muted (знахідка 01). Якщо токен колись
    // потемнішає до AA — цю перевірку можна зняти разом із токеном.
    expect(contrast(token('dental-text-light'), '#ffffff')).toBeLessThan(AA)
  })
})

describe('бейджі ролей: інк на тінті ≥ AA 4.5:1', () => {
  it.each([
    ['role-clinical-700', 'role-clinical-100'],
    ['role-clinical-soft-700', 'role-clinical-soft-100'],
    ['role-ops-700', 'role-ops-100'],
    ['role-ops-700', 'role-ops-200'],
  ])('%s на %s', (ink, tint) => {
    expect(contrast(token(ink), token(tint))).toBeGreaterThanOrEqual(AA)
  })

  it('білий на dental-dark і на dental-primary-600 (суцільні бейджі)', () => {
    expect(contrast('#ffffff', token('dental-dark'))).toBeGreaterThanOrEqual(AA)
    expect(
      contrast('#ffffff', token('dental-primary-600'))
    ).toBeGreaterThanOrEqual(AA)
  })
})

describe('суцільні кнопкові заливки з білим текстом ≥ AA', () => {
  // Тільки фони, на яких у продукті реально стоїть білий текст. Світлі
  // dental-success/-warning білим текстом не проходять AA — тому кнопки
  // потоку замовлень/стоку використовують dental-success-dark і
  // status-warning-700 (див. AdminOrdersPage/stock), що й перевіряється тут.
  it.each([
    'dental-error', // Button variant="danger" + ConfirmDialog irreversible
    'dental-success-dark',
    'status-warning-700',
    'dental-primary-600',
    'dental-primary-700',
  ])('білий на %s', name => {
    expect(contrast('#ffffff', token(name))).toBeGreaterThanOrEqual(AA)
  })
})
