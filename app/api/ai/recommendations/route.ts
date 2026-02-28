import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const RecommendationSchema = z.object({
  primaryRecommendation: z.object({
    serviceName: z.string(),
    reason: z.string(),
    urgency: z.enum(['routine', 'soon', 'urgent']),
    estimatedDuration: z.string(),
  }),
  additionalRecommendations: z.array(z.object({
    serviceName: z.string(),
    reason: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  preventiveCare: z.array(z.string()),
  lifestyleTips: z.array(z.string()),
  disclaimer: z.string(),
})

export async function POST(req: Request) {
  const { 
    symptoms, 
    painLevel, 
    lastVisit, 
    concerns,
    language = 'uk' 
  }: { 
    symptoms: string[]
    painLevel?: number
    lastVisit?: string
    concerns?: string
    language?: string 
  } = await req.json()

  // Fetch available services from database
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('name_uk, name_en, description_uk, category, price_uah, duration_minutes')
    .eq('is_active', true)

  const servicesContext = services?.map(s => 
    `- ${s.name_uk} (${s.category}): ${s.description_uk || 'Немає опису'}, ${s.price_uah} грн, ${s.duration_minutes} хв`
  ).join('\n') || ''

  const languageInstruction = language === 'en' 
    ? 'Respond in English.'
    : language === 'pl'
    ? 'Respond in Polish.'
    : 'Respond in Ukrainian.'

  const prompt = `You are a dental treatment recommendation AI for Dental Story clinic in Ukraine.

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

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    output: Output.object({ schema: RecommendationSchema }),
    abortSignal: req.signal,
  })

  return Response.json({
    success: true,
    recommendations: result.object,
  })
}
