/**
 * Seed: reviews table
 *
 * Creates 35 realistic Ukrainian patient reviews.
 * Rating distribution: 5★(55%), 4★(25%), 3★(12%), 2★(5%), 1★(3%).
 * Mix of verified (linked to real patient) and guest reviews.
 * Status: published(80%), pending(15%), hidden(5%).
 */

import { supabase, faker, SEED, uaFullName } from './00_config.ts'
import type { SeededPatient } from './04_patients.ts'
import type { SeededDoctor } from './01_doctors.ts'

const POSITIVE_TEXTS = [
  'Чудова клініка! Лікар дуже уважний і пояснює кожен крок. Рекомендую всім знайомим.',
  'Нарешті знайшла стоматолога, якого не боюся. Щиро дякую всій команді!',
  'Прийшов із сильним болем — прийняли без черги, допомогли швидко. Дуже вдячний.',
  'Дуже чисто, сучасне обладнання, привітний персонал. Буду приходити тільки сюди.',
  'Пломбування зробили ідеально — зуб не болить і виглядає природньо.',
  'Відбілювання перевершило очікування. Результат видно одразу!',
  'Дитина не боялася — лікар знайшов підхід, спокійно пояснював що робить.',
  'Імплант поставили без жодного дискомфорту. Через тиждень забула, що це не рідний зуб.',
  'Персонал дуже ввічливий, завжди нагадують про запис. Приємно мати таку клініку поряд.',
  'Брекети поставили акуратно, лікар детально розповів про догляд. Задоволена!',
  'Записалась онлайн — дуже зручно. Черги немає, все по часу.',
  'Ціни адекватні, якість — вище очікувань. Давно шукала таке місце.',
  'Зробили панорамний знімок швидко, результат одразу на руки.',
  'Відмінна анестезія — взагалі нічого не відчула під час процедури!',
  'Гарне розташування, є паркінг. Дуже задоволена першим візитом.',
  'Ультразвукове чищення — навіть не боляче! Зуби після — як після відбілювання.',
  "Лікар запам'ятав мою ситуацію, на наступному візиті одразу спитав як я почуваюсь.",
  'Щиро дякую за терпіння з моєю зубофобією. Буду повертатись!',
]

const NEUTRAL_TEXTS = [
  'Прийом був непоганий, але довелось трохи почекати. Якість роботи гарна.',
  'Все нормально, лікар компетентний. Ціни трохи вищі ніж очікував.',
  'Загалом задоволений, але адміністратор не одразу відповів на дзвінок.',
  'Хороша клініка. Хотілось би більше місць для паркування.',
  'Лікування проведено якісно. Буду думати чи повертатись — ціна трохи кусається.',
]

const NEGATIVE_TEXTS = [
  'Очікував більшого. Довго чекав прийому, ніхто не попередив про затримку.',
  'Неприємний досвід — лікар поспішав, не пояснив план лікування.',
]

export async function seedReviews(
  patients: SeededPatient[],
  doctors: SeededDoctor[]
): Promise<void> {
  console.log('\n⭐  Seeding reviews…')

  const ratingWeights = [
    { weight: 55, value: 5 },
    { weight: 25, value: 4 },
    { weight: 12, value: 3 },
    { weight: 5, value: 2 },
    { weight: 3, value: 1 },
  ]

  const statusWeights = [
    { weight: 80, value: 'published' as const },
    { weight: 15, value: 'pending' as const },
    { weight: 5, value: 'hidden' as const },
  ]

  const rows = Array.from({ length: SEED.reviews }, () => {
    const rating = faker.helpers.weightedArrayElement(ratingWeights)
    const swValue = faker.helpers.weightedArrayElement(statusWeights)

    // Pick text appropriate for rating
    let text: string
    if (rating >= 4) {
      text = faker.helpers.arrayElement(POSITIVE_TEXTS)
    } else if (rating === 3) {
      text = faker.helpers.arrayElement(NEUTRAL_TEXTS)
    } else {
      text = faker.helpers.arrayElement(NEGATIVE_TEXTS)
    }
    // 60% are linked to real patients, 40% are guest reviews
    const isLinked = faker.datatype.boolean(0.6)
    const patient = isLinked ? faker.helpers.arrayElement(patients) : null
    const { full } = uaFullName(faker.datatype.boolean() ? 'male' : 'female')

    return {
      patient_id: patient?.id ?? null,
      patient_name: patient?.full_name ?? full,
      doctor_id: faker.datatype.boolean(0.7)
        ? faker.helpers.arrayElement(doctors).id
        : null,
      rating,
      text,
      status: swValue,
      is_verified: isLinked,
      created_at: faker.date.recent({ days: 180 }).toISOString(),
    }
  })

  const BATCH = 20
  let count = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('reviews')
      .insert(rows.slice(i, i + BATCH))
    if (error) console.warn(`   ⚠️  reviews batch: ${error.message}`)
    else count += Math.min(BATCH, rows.length - i)
  }

  console.log(`   ✅  ${count} reviews`)
}
