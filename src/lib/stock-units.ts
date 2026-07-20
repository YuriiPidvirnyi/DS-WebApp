/**
 * Shared stock unit codes + their i18n label resolution. Single source for both
 * the materials list and the material detail editor (which also uses PACK_UNITS
 * as the pack-size dropdown options and its element type).
 */
export const PACK_UNITS = [
  'шт',
  'г',
  'кг',
  'мл',
  'л',
  'см',
  'м',
  'пара',
  'набір',
] as const

export type PackUnit = (typeof PACK_UNITS)[number]

// `satisfies` enforces that every PACK_UNIT has a label key at compile time — a
// new unit added above without a label here fails typecheck (restores the
// exhaustiveness the inline map used to give).
const UNIT_LABEL_KEYS = {
  шт: 'admin.stock.materialDetailPage.unitPcs',
  г: 'admin.stock.materialDetailPage.unitGram',
  кг: 'admin.stock.materialDetailPage.unitKg',
  мл: 'admin.stock.materialDetailPage.unitMl',
  л: 'admin.stock.materialDetailPage.unitLiter',
  см: 'admin.stock.materialDetailPage.unitCm',
  м: 'admin.stock.materialDetailPage.unitMeter',
  пара: 'admin.stock.materialDetailPage.unitPair',
  набір: 'admin.stock.materialDetailPage.unitSet',
} satisfies Record<PackUnit, string>

/**
 * Localized label for a unit code (raw Cyrillic data value), falling back to
 * the raw code for any unit not in the map. Encapsulates the string lookup so
 * callers with a free-string `code` don't need an unsafe index cast.
 */
export function unitLabel(t: (key: string) => string, code: string): string {
  const key = (UNIT_LABEL_KEYS as Record<string, string>)[code]
  return key ? t(key) : code
}
