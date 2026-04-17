/**
 * Seed: materials + material_inventory
 *
 * Creates 30 realistic dental consumables across all categories.
 * Each has realistic Ukrainian supplier names, unit prices, and stock levels.
 */

import { supabase, faker } from './00_config.ts'

export interface SeededMaterial {
  id: string
  name: string
  category: string
  current_quantity: number
  unit_price: number
}

type MaterialCategory =
  | 'composite'
  | 'filling'
  | 'instrument'
  | 'implant'
  | 'hygiene'
  | 'anesthesia'
  | 'other'

interface MaterialSpec {
  name: string
  category: MaterialCategory
  unit: string
  unitPrice: number
  minStock: number
  initialStock: number
}

const MATERIALS: MaterialSpec[] = [
  {
    name: 'Filtek Supreme Ultra (3M ESPE)',
    category: 'composite',
    unit: 'шт',
    unitPrice: 850,
    minStock: 5,
    initialStock: 12,
  },
  {
    name: 'Charisma (Kulzer)',
    category: 'composite',
    unit: 'шт',
    unitPrice: 720,
    minStock: 5,
    initialStock: 8,
  },
  {
    name: 'Evetric (Ivoclar)',
    category: 'composite',
    unit: 'шт',
    unitPrice: 980,
    minStock: 3,
    initialStock: 6,
  },
  {
    name: 'Цемент скловіономерний Fuji IX (GC)',
    category: 'filling',
    unit: 'упак',
    unitPrice: 1200,
    minStock: 2,
    initialStock: 4,
  },
  {
    name: 'Ketac Molar (3M ESPE)',
    category: 'filling',
    unit: 'упак',
    unitPrice: 950,
    minStock: 2,
    initialStock: 3,
  },
  {
    name: 'Кальцій-гідроксид Dycal (Dentsply)',
    category: 'filling',
    unit: 'шт',
    unitPrice: 580,
    minStock: 3,
    initialStock: 5,
  },
  {
    name: 'Endofl файли K-type набір 25мм',
    category: 'instrument',
    unit: 'упак',
    unitPrice: 450,
    minStock: 5,
    initialStock: 15,
  },
  {
    name: 'ProTaper Gold набір (Dentsply)',
    category: 'instrument',
    unit: 'упак',
    unitPrice: 2100,
    minStock: 3,
    initialStock: 7,
  },
  {
    name: 'Дзеркало стоматологічне №5 (упак 12)',
    category: 'instrument',
    unit: 'упак',
    unitPrice: 280,
    minStock: 2,
    initialStock: 6,
  },
  {
    name: 'Зонд стоматологічний кутовий',
    category: 'instrument',
    unit: 'шт',
    unitPrice: 120,
    minStock: 5,
    initialStock: 20,
  },
  {
    name: 'Implant (Straumann BL 4.1×10)',
    category: 'implant',
    unit: 'шт',
    unitPrice: 14000,
    minStock: 2,
    initialStock: 4,
  },
  {
    name: 'Implant (MIS C1 3.75×10)',
    category: 'implant',
    unit: 'шт',
    unitPrice: 8500,
    minStock: 2,
    initialStock: 3,
  },
  {
    name: 'Абатмент прямий (Universal)',
    category: 'implant',
    unit: 'шт',
    unitPrice: 2200,
    minStock: 2,
    initialStock: 4,
  },
  {
    name: 'Рукавички латексні S (100 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 180,
    minStock: 10,
    initialStock: 30,
  },
  {
    name: 'Рукавички латексні M (100 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 180,
    minStock: 10,
    initialStock: 35,
  },
  {
    name: 'Рукавички латексні L (100 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 180,
    minStock: 5,
    initialStock: 15,
  },
  {
    name: 'Маски медичні (50 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 120,
    minStock: 10,
    initialStock: 40,
  },
  {
    name: 'Серветки стоматологічні (500 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 95,
    minStock: 5,
    initialStock: 20,
  },
  {
    name: 'Слинники (500 шт)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 85,
    minStock: 5,
    initialStock: 18,
  },
  {
    name: 'Артикуляційний папір 40 мкм (BK09)',
    category: 'hygiene',
    unit: 'упак',
    unitPrice: 180,
    minStock: 3,
    initialStock: 8,
  },
  {
    name: 'Лідокаїн 2% 1.8мл карпули (50 шт)',
    category: 'anesthesia',
    unit: 'упак',
    unitPrice: 850,
    minStock: 5,
    initialStock: 10,
  },
  {
    name: 'Ультракаїн DS Forte 1.7мл (50 шт)',
    category: 'anesthesia',
    unit: 'упак',
    unitPrice: 980,
    minStock: 5,
    initialStock: 8,
  },
  {
    name: 'Septonest SP 1:100000 (50 шт)',
    category: 'anesthesia',
    unit: 'упак',
    unitPrice: 760,
    minStock: 3,
    initialStock: 6,
  },
  {
    name: 'Адреналін 0.1% 1мл (10 амп)',
    category: 'anesthesia',
    unit: 'упак',
    unitPrice: 140,
    minStock: 5,
    initialStock: 2,
  }, // low stock intentional
  {
    name: 'Відбивна маса Impregum Penta (3M)',
    category: 'other',
    unit: 'упак',
    unitPrice: 3200,
    minStock: 2,
    initialStock: 3,
  },
  {
    name: 'Тимчасовий цемент Temp-Bond (Kerr)',
    category: 'other',
    unit: 'шт',
    unitPrice: 680,
    minStock: 2,
    initialStock: 4,
  },
  {
    name: 'Воск базисний (упак)',
    category: 'other',
    unit: 'упак',
    unitPrice: 95,
    minStock: 3,
    initialStock: 1,
  }, // low stock intentional
  {
    name: 'Пасти полірувальні набір (Rondoflex)',
    category: 'other',
    unit: 'упак',
    unitPrice: 420,
    minStock: 2,
    initialStock: 5,
  },
  {
    name: 'Хлоргексидин 0.05% 100мл',
    category: 'other',
    unit: 'шт',
    unitPrice: 35,
    minStock: 10,
    initialStock: 25,
  },
  {
    name: 'Гіпохлорит натрію 3% 250мл',
    category: 'other',
    unit: 'шт',
    unitPrice: 45,
    minStock: 5,
    initialStock: 12,
  },
]

export async function seedMaterials(): Promise<SeededMaterial[]> {
  console.log('\n🧪  Seeding materials…')

  const materialRows = MATERIALS.map(m => ({
    name: m.name,
    category: m.category,
    unit: m.unit,
    unit_price: m.unitPrice,
    min_stock_level: m.minStock,
    supplier: faker.helpers.arrayElement([
      'МедДент-Постач',
      'Dental-Prime UA',
      'ОртоДент Трейд',
      'Стомекс',
      'DentPro Україна',
    ]),
    is_active: true,
  }))

  const { data: materials, error: mErr } = await supabase
    .from('materials')
    .upsert(materialRows, { onConflict: 'name', ignoreDuplicates: false })
    .select('id, name, category, unit_price')

  if (mErr) throw new Error(`materials: ${mErr.message}`)

  // Seed material_inventory for each material
  const inventoryRows = materials!.map((m, i) => ({
    material_id: m.id,
    current_quantity: MATERIALS[i].initialStock,
    last_updated_at: new Date().toISOString(),
  }))

  const { error: invErr } = await supabase
    .from('material_inventory')
    .upsert(inventoryRows, {
      onConflict: 'material_id',
      ignoreDuplicates: false,
    })

  if (invErr) console.warn(`   ⚠️  inventory upsert: ${invErr.message}`)

  const result = materials!.map((m, i) => ({
    ...m,
    current_quantity: MATERIALS[i].initialStock,
  }))

  console.log(
    `   ✅  ${result.length} materials (incl. 2 intentionally low-stock for alert testing)`
  )
  return result
}
