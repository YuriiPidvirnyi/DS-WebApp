import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
} from 'ai'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

// Tool to fetch available services from database
const getServicesTool = tool({
  description: 'Get list of dental services with prices. Use when user asks about services, treatments, or prices.',
  inputSchema: z.object({
    category: z.string().nullable().describe('Optional category filter: Діагностика, Гігієна, Терапія, Хірургія, Імплантологія, Протезування, Естетика, Ортодонтія, Дитяча стоматологія'),
  }),
  execute: async ({ category }) => {
    const supabase = await createClient()
    let query = supabase.from('services').select('*').eq('is_active', true)
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query.order('price_uah', { ascending: true })
    
    if (error) {
      return { error: 'Failed to fetch services' }
    }
    
    return {
      services: data?.map(s => ({
        name: s.name_uk,
        description: s.description_uk,
        category: s.category,
        price: `${s.price_uah} грн`,
        duration: `${s.duration_minutes} хв`,
      })) || [],
    }
  },
})

// Tool to fetch doctors information
const getDoctorsTool = tool({
  description: 'Get information about clinic doctors. Use when user asks about doctors, specialists, or team.',
  inputSchema: z.object({
    specialization: z.string().nullable().describe('Optional specialization filter'),
  }),
  execute: async ({ specialization }) => {
    const supabase = await createClient()
    let query = supabase.from('doctors').select('*').eq('is_active', true)
    
    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { error: 'Failed to fetch doctors' }
    }
    
    return {
      doctors: data?.map(d => ({
        name: `${d.first_name} ${d.last_name}`,
        specialization: d.specialization,
        experience: `${d.experience_years} років досвіду`,
        education: d.education,
        bio: d.bio,
      })) || [],
    }
  },
})

// Tool to get working hours
const getWorkingHoursTool = tool({
  description: 'Get clinic working hours. Use when user asks about schedule, opening hours, or when the clinic is open.',
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .order('day_of_week')
    
    if (error) {
      return { error: 'Failed to fetch working hours' }
    }
    
    const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота']
    
    return {
      hours: data?.map(h => ({
        day: dayNames[h.day_of_week],
        time: h.is_closed ? 'Закрито' : `${h.open_time.slice(0, 5)} - ${h.close_time.slice(0, 5)}`,
      })) || [],
    }
  },
})

// Symptom analysis tool
const analyzeSymptomsTool = tool({
  description: 'Analyze dental symptoms and provide preliminary assessment. Use when user describes pain, discomfort, or dental issues.',
  inputSchema: z.object({
    symptoms: z.array(z.string()).describe('List of symptoms described by user'),
    painLevel: z.number().min(1).max(10).nullable().describe('Pain level from 1-10 if mentioned'),
    duration: z.string().nullable().describe('How long the symptoms have been present'),
  }),
  execute: async ({ symptoms, painLevel }) => {
    // Map symptoms to potential conditions and urgency
    const symptomAnalysis: Record<string, { conditions: string[], urgency: string, recommendation: string }> = {
      'біль': { conditions: ['Карієс', 'Пульпіт', 'Періодонтит'], urgency: 'середня', recommendation: 'Рекомендуємо записатися на огляд протягом 1-2 днів' },
      'набряк': { conditions: ['Абсцес', 'Періодонтит', 'Перикороніт'], urgency: 'висока', recommendation: 'Потрібна термінова консультація!' },
      'кровоточивість': { conditions: ['Гінгівіт', 'Пародонтит'], urgency: 'низька', recommendation: 'Рекомендуємо професійну чистку та огляд пародонтолога' },
      'чутливість': { conditions: ['Карієс', 'Оголення шийки зуба', 'Тріщина емалі'], urgency: 'низька', recommendation: 'Запишіться на діагностику' },
      'запах': { conditions: ['Карієс', 'Захворювання ясен', 'Зубний камінь'], urgency: 'низька', recommendation: 'Рекомендуємо професійну чистку' },
    }
    
    const findings = symptoms.map(s => {
      const lowerSymptom = s.toLowerCase()
      for (const [key, value] of Object.entries(symptomAnalysis)) {
        if (lowerSymptom.includes(key)) {
          return { symptom: s, ...value }
        }
      }
      return { symptom: s, conditions: ['Потребує огляду'], urgency: 'середня', recommendation: 'Рекомендуємо консультацію спеціаліста' }
    })
    
    const hasHighUrgency = findings.some(f => f.urgency === 'висока')
    const highPain = painLevel && painLevel >= 7
    
    return {
      analysis: findings,
      overallUrgency: hasHighUrgency || highPain ? 'ТЕРМІНОВО' : 'Планово',
      disclaimer: 'Це попередня оцінка на основі описаних симптомів. Точний діагноз може поставити тільки лікар після огляду.',
      nextStep: hasHighUrgency || highPain 
        ? 'Телефонуйте нам негайно: +380 67 123 45 67' 
        : 'Запишіться на консультацію через сайт або за телефоном',
    }
  },
})

// Booking helper tool
// Booking helper tool for appointment assistance
const bookingHelperTool = tool({
  description: 'Help user with booking information. Use when user wants to make an appointment.',
  inputSchema: z.object({
    serviceType: z.string().nullable().describe('Type of service user is interested in'),
    preferredDate: z.string().nullable().describe('Preferred date if mentioned'),
  }),
  execute: async ({ serviceType, preferredDate }) => {
    return {
      bookingUrl: '/booking',
      message: 'Я можу допомогти вам записатися на прийом!',
      steps: [
        'Перейдіть на сторінку запису',
        'Оберіть послугу та лікаря',
        'Виберіть зручний час',
        'Заповніть контактні дані',
      ],
      phone: '+380 67 123 45 67',
      note: serviceType ? `Для послуги "${serviceType}" рекомендую попередню консультацію` : null,
      preferredDate: preferredDate || null,
    }
  },
})

const tools = {
  getServices: getServicesTool,
  getDoctors: getDoctorsTool,
  getWorkingHours: getWorkingHoursTool,
  analyzeSymptoms: analyzeSymptomsTool,
  bookingHelper: bookingHelperTool,
}

const systemPrompt = `Ви - віртуальний асистент стоматологіч��ої клініки "Dental Story" у Львові, Україна.

ВАШІ МОЖЛИВОСТІ:
- Відповідати на питання про послуги та ціни (використовуйте getServices)
- Розповідати про лікарів клініки (використовуйте getDoctors)
- Інформувати про графік роботи (використовуйте getWorkingHours)
- Аналізувати симптоми та давати попередні рекомендації (використовуйте analyzeSymptoms)
- Допомагати з записом на прийом (використовуйте bookingHelper)

ПРАВИЛА:
1. Відповідайте українською мовою (або мовою користувача якщо він пише англійською/польською)
2. Будьте ввічливими та професійними
3. Не ставте медичних діагнозів - тільки попередні рекомендації
4. Завжди рекомендуйте особисту консультацію для точного діагнозу
5. При терміновому випадку (сильний біль, набряк) - рекомендуйте негайно зателефонувати
6. Ціни вказуйте в гривнях (грн)

КОНТАКТНА ІНФОРМАЦІЯ:
- Телефон: +380 67 123 45 67
- Адреса: вул. Шевченка, 15, Львів
- Email: info@dentalstory.ua

Якщо не знаєте відповіді - чесно скажіть і запропонуйте зв'язатися з клінікою напряму.`

export async function POST(req: Request) {
  const { messages, language = 'uk' }: { messages: UIMessage[], language?: string } = await req.json()

  const languageInstruction = language === 'en' 
    ? '\n\nIMPORTANT: The user prefers English. Respond in English.'
    : language === 'pl'
    ? '\n\nIMPORTANT: The user prefers Polish. Respond in Polish.'
    : ''

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt + languageInstruction,
    messages: await convertToModelMessages(messages),
    tools,
    maxSteps: 5,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
