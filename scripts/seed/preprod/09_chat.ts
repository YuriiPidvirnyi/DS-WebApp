/**
 * Seed: chat_sessions + chat_messages
 *
 * Creates 20 chat sessions between patients and admin.
 * Each session has 4–24 messages in realistic Ukrainian dental support dialog.
 * Some sessions are resolved, some open, some with unread messages.
 */

import { supabase, faker, SEED } from './00_config.ts'
import type { SeededPatient } from './04_patients.ts'

const PATIENT_OPENERS = [
  'Добрий день! Хочу записатись на консультацію.',
  'Вітаю! Маю питання щодо мого лікування.',
  "Скажіть, будь ласка, чи є вільний час на п'ятницю?",
  'Добрий ранок! У мене сильно болить зуб, коли можна прийти?',
  'Хотіла уточнити вартість відбілювання.',
  'Доброго дня! Я скасувала запис, хочу перенести на інший день.',
  'Привіт, чи приймаєте ви дитину 8 років?',
  'Скажіть, що входить в комплексне чищення зубів?',
  'Добрий вечір! Коли отримаю результати знімка?',
  'Вітаю! Як підготуватись до видалення зуба?',
  'Зламала частину зуба — коли можу прийти терміново?',
  'Чи потрібно направлення від лікаря для імплантації?',
  'Скільки коштує брекет-система? Яку рекомендуєте?',
  'Доброго дня! Уточніть, будь ласка, чи є паркінг біля клініки.',
  'Дякую за чудове лікування! Хочу залишити відгук.',
  'Добрий день, хочу дізнатись про програму знижок.',
  'Коли приблизно чекати результатів аналізів?',
  'Мене турбує ясна після пломбування — це нормально?',
  'Чи займаєтесь виготовленням кап для відбілювання?',
  'Хочу перенести завтрашній прийом на наступний тиждень.',
]

const ADMIN_REPLIES = [
  'Доброго дня! Звичайно, підкажіть зручний для вас день та час.',
  'Вітаємо! Будь ласка, уточніть ваше запитання і ми залюбки допоможемо.',
  'Так, є вільний час. Вас влаштовує 14:00 або 16:30?',
  'Розуміємо, що це неприємно. Спробуємо прийняти вас якнайшвидше.',
  'Вартість відбілювання — 3500 грн. Включає первинну консультацію.',
  'Звісно, оберіть зручну дату і ми перезапишемо.',
  'Так, дитячого стоматолога маємо. Запишіть дитину до нас.',
  'Комплексне чищення включає ультразвук та Air Flow — 1800 грн.',
  'Знімок будете мати одразу після процедури.',
  'Перед видаленням не їжте 3 години і не вживайте алкоголю.',
  'Будь ласка, приходьте якнайшвидше, лікар прийме позачергово.',
  'Ні, направлення не потрібне. Приходьте на безкоштовну консультацію.',
  'Металева система — від 18000 грн, сапфірова — від 25000 грн.',
  'Паркінг є безпосередньо біля входу, безкоштовний.',
  'Дякуємо! Будемо раді вашому відгуку на Google або напряму.',
  'У нас є карта лояльності — 5% знижка після 3 візитів.',
  'Результати будуть протягом 3 робочих днів.',
  'Невеликий дискомфорт — це нормально, якщо більше 3 днів — телефонуйте.',
  'Так, виготовляємо. Коштує 800 грн за обидві щелепи.',
  'Перенесено. Підтвердження надішлемо на вашу пошту.',
]

const PATIENT_FOLLOWUP = [
  'Дякую! Тоді запишіть мене, будь ласка.',
  'Добре, я підійду завтра.',
  'Зрозуміло, дякую за відповідь.',
  'Окей, чекаю підтвердження.',
  'Дуже дякую! Ви дуже допомогли.',
  'Гаразд, тоді на наступний тиждень.',
  'Чудово! До зустрічі.',
  'Ще одне питання — чи є знижки для пенсіонерів?',
  'А чи приймаєте в суботу?',
  'Добре зрозуміла. Дякую!',
]

export async function seedChat(patients: SeededPatient[]): Promise<void> {
  console.log('\n💬  Seeding chat sessions + messages…')

  const sessionPatients = faker.helpers
    .shuffle(patients)
    .slice(0, SEED.chatSessions)
  let totalMessages = 0

  for (const patient of sessionPatients) {
    const isResolved = faker.datatype.boolean(0.5)
    const sessionCreated = faker.date.recent({ days: 60 })

    const { data: session, error: sErr } = await supabase
      .from('chat_sessions')
      .insert({
        patient_id: patient.id,
        patient_name: patient.full_name,
        status: isResolved ? 'resolved' : 'active',
        created_at: sessionCreated.toISOString(),
        updated_at: sessionCreated.toISOString(),
      })
      .select('id')
      .single()

    if (sErr) {
      console.warn(`   ⚠️  session: ${sErr.message}`)
      continue
    }

    const msgCount = faker.number.int(SEED.messagesPerChat)
    const openerIdx = faker.number.int({
      min: 0,
      max: PATIENT_OPENERS.length - 1,
    })
    const messages = []

    let msgTime = new Date(sessionCreated)

    // First message always from patient
    messages.push({
      session_id: session.id,
      sender: 'patient' as const,
      content: PATIENT_OPENERS[openerIdx],
      created_at: msgTime.toISOString(),
      is_read: true,
    })

    for (let m = 1; m < msgCount; m++) {
      msgTime = new Date(
        msgTime.getTime() + faker.number.int({ min: 60000, max: 3600000 })
      )
      const isPatient = m % 2 === 0

      let content: string
      if (isPatient) {
        content = faker.helpers.arrayElement(PATIENT_FOLLOWUP)
      } else {
        content = faker.helpers.arrayElement(ADMIN_REPLIES)
      }

      messages.push({
        session_id: session.id,
        sender: isPatient ? ('patient' as const) : ('admin' as const),
        content,
        created_at: msgTime.toISOString(),
        is_read: isResolved ? true : m < msgCount - 2,
      })
    }

    const { error: mErr } = await supabase
      .from('chat_messages')
      .insert(messages)
    if (mErr) console.warn(`   ⚠️  messages: ${mErr.message}`)
    else totalMessages += messages.length

    process.stdout.write('.')
  }

  console.log(
    `\n   ✅  ${sessionPatients.length} chat sessions, ~${totalMessages} messages`
  )
}
