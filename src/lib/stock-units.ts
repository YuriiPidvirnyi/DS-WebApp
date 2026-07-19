/**
 * Shared unit-code → i18n-key map for stock materials. Keyed by the raw unit
 * code stored on a material (Cyrillic data value), resolved to a localized
 * label at the render site via t(); callers fall back to the raw code for any
 * unit not in the map.
 */
export const UNIT_LABEL_KEYS: Record<string, string> = {
  шт: 'admin.stock.materialDetailPage.unitPcs',
  г: 'admin.stock.materialDetailPage.unitGram',
  кг: 'admin.stock.materialDetailPage.unitKg',
  мл: 'admin.stock.materialDetailPage.unitMl',
  л: 'admin.stock.materialDetailPage.unitLiter',
  см: 'admin.stock.materialDetailPage.unitCm',
  м: 'admin.stock.materialDetailPage.unitMeter',
  пара: 'admin.stock.materialDetailPage.unitPair',
  набір: 'admin.stock.materialDetailPage.unitSet',
}
