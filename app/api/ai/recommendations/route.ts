import { NextRequest } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { hashIp, checkDailyBudget, logAiUsage } from '@/lib/ai-usage'
import { captureException } from '@/utils/sentry'
import { SITE_INFO } from '@/utils/constants'

export const maxDuration = 30

const RecommendationSchema = z.object({
  primaryRecommendation: z.object({
    serviceName: z.string(),
    reason: z.string(),
    urgency: z.enum(['routine', 'soon', 'urgent']),
    estimatedDuration: z.string(),
  }),
  additionalRecommendations: z.array(
    z.object({
      serviceName: z.string(),
      reason: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    })
  ),
  preventiveCare: z.array(z.string()),
  lifestyleTips: z.array(z.string()),
  disclaimer: z.string(),
})

export async function POST(req: NextRequest) {
  // CSRF validation
  if (!validateCSRF(req)) return csrfErrorResponse()

  // Rate limiting: 10 requests per minute
  const { allowed, remaining } = await checkRateLimit(req, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  // Daily token budget guard (50k tokens/IP/day)
  const ipHash = hashIp(req)
  const { allowed: budgetAllowed } = await checkDailyBudget(ipHash)
  if (!budgetAllowed) {
    return Response.json(
      {
        success: false,
        error: 'Daily AI usage limit reached. Try again tomorrow.',
      },
      { status: 429 }
    )
  }

  let body: {
    symptoms?: unknown
    painLevel?: number
    lastVisit?: string
    concerns?: string
    language?: string
  }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  const { painLevel, lastVisit, concerns, language = 'uk' } = body

  if (!Array.isArray(body.symptoms) || body.symptoms.length === 0) {
    return Response.json(
      { success: false, error: 'Симптоми є обовʼязковими (масив рядків)' },
      { status: 400 }
    )
  }

  const symptoms: string[] = body.symptoms.filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  )

  if (symptoms.length === 0) {
    return Response.json(
      { success: false, error: 'Потрібен хоча б один симптом' },
      { status: 400 }
    )
  }

  // Fetch available services from database
  const supabase = await createClient()
  let services:
    | {
        name_uk: string
        name_en: string
        description_uk: string
        category: string
        price_uah: number
        duration_minutes: number
      }[]
    | null = null
  if (supabase) {
    const { data } = await supabase
      .from('services')
      .select(
        'name_uk, name_en, description_uk, category, price_uah, duration_minutes'
      )
      .eq('is_active', true)
    services = data
  }

  const servicesContext =
    services
      ?.map(
        s =>
          `- ${s.name_uk} (${s.category}): ${s.description_uk || 'Немає опису'}, ${s.price_uah} грн, ${s.duration_minutes} хв`
      )
      .join('\n') || ''

  const languageInstruction =
    language === 'en'
      ? 'Respond in English.'
      : language === 'pl'
        ? 'Respond in Polish.'
        : 'Respond in Ukrainian.'

  const prompt = `You are a dental treatment recommendation AI for ${SITE_INFO.name} clinic in Ukraine.

Based on the patient information, recommend appropriate dental treatments from our available services.

PATIENT INFORMATION:
- Symptoms: ${symptoms.join(', ')}
- Pain level: ${painLevel ? `${painLevel}/10` : 'Not specified'}
- Last dental visit: ${lastVisit || 'Unknown'}
- Additional concerns: ${concerns || 'None specified'}

AVAILABLE SERVICES:
${servicesContext}

GUIDELINES:
1. ${languageInstruction}
2. Recommend the most appropriate primary treatment
3. Suggest additional treatments if beneficial
4. Include preventive care recommendations
5. Provide lifestyle tips for dental health
6. Always include a medical disclaimer

Be helpful and professional. Do not diagnose - only recommend services based on symptoms.`

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      output: Output.object({ schema: RecommendationSchema }),
      abortSignal: req.signal,
    })

    logAiUsage('recommendations', 'openai/gpt-4o-mini', result.usage, ipHash)

    return Response.json({
      success: true,
      data: result.output,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json(
        { success: false, error: 'Запит скасовано' },
        { status: 499 }
      )
    }
    captureException(error instanceof Error ? error : new Error(String(error)))
    return Response.json(
      { success: false, error: 'Не вдалося отримати рекомендації' },
      { status: 500 }
    )
  }
}
