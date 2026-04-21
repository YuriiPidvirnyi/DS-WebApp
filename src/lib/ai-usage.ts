import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// gpt-4o-mini pricing (USD per token)
const COST_PER_INPUT_TOKEN = 0.15 / 1_000_000
const COST_PER_OUTPUT_TOKEN = 0.6 / 1_000_000

const DAILY_TOKEN_LIMIT = 50_000
// Global monthly cap across all IPs — prevents runaway spend
const MONTHLY_GLOBAL_TOKEN_LIMIT = 5_000_000

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

export interface TokenUsage {
  inputTokens?: number
  outputTokens?: number
}

export async function checkDailyBudget(
  ipHash: string
): Promise<{ allowed: boolean }> {
  const supabase = getServiceClient()
  if (!supabase) return { allowed: true } // no client → don't block

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('ai_usage')
    .select('input_tokens, output_tokens')
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if (!data) return { allowed: true }

  const total = data.reduce(
    (sum, row) => sum + (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
    0
  )

  return { allowed: total < DAILY_TOKEN_LIMIT }
}

export async function checkMonthlyBudget(): Promise<{ allowed: boolean }> {
  const supabase = getServiceClient()
  if (!supabase) return { allowed: true }

  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('ai_usage')
    .select('input_tokens, output_tokens')
    .gte('created_at', since.toISOString())

  if (!data) return { allowed: true }

  const total = data.reduce(
    (sum, row) => sum + (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
    0
  )

  return { allowed: total < MONTHLY_GLOBAL_TOKEN_LIMIT }
}

export function logAiUsage(
  route: 'chat' | 'recommendations',
  model: string,
  usage: TokenUsage,
  ipHash: string
): void {
  const supabase = getServiceClient()
  if (!supabase) return

  const inputTokens = usage.inputTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const cost =
    inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN

  // Fire-and-forget — don't block the response
  void supabase.from('ai_usage').insert({
    route,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
    ip_hash: ipHash,
  })
}
