/**
 * A/B testing framework backed by Vercel Edge Config.
 *
 * Server usage (Server Components / Route Handlers):
 *   const variant = await getVariant('hero-cta')  // 'control' | 'variant-a' | null
 *
 * When EDGE_CONFIG is not configured (local dev, preview without the store)
 * all functions return null and the control experience is shown.
 *
 * Edge Config schema per test key `ab_<testId>`:
 *   { id: string; active: boolean; variants: string[]; split: number[] }
 *
 * split is a weight array that must sum to ≤ 1 (e.g. [0.5, 0.5]).
 */

import { get } from '@vercel/edge-config'
import { cookies } from 'next/headers'

interface TestConfig {
  id: string
  active: boolean
  variants: string[]
  /** Weights ∈ (0,1) that sum to ≤ 1. Remainder goes to last variant. */
  split: number[]
}

function weightedPick(variants: string[], weights: number[]): string {
  const r = Math.random()
  let cumulative = 0
  for (let i = 0; i < variants.length - 1; i++) {
    cumulative += weights[i] ?? 0
    if (r < cumulative) return variants[i]!
  }
  return variants[variants.length - 1]!
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

/**
 * Returns the variant assigned to this visitor for the given test.
 * Assigns a new variant (sticky via cookie) if none exists.
 * Returns null when the test is inactive or Edge Config is unavailable.
 */
export async function getVariant(testId: string): Promise<string | null> {
  try {
    const config = await get<TestConfig>(`ab_${testId}`)
    if (!config?.active || !config.variants.length) return null

    const jar = await cookies()
    const cookieKey = `ds_ab_${testId}`
    const existing = jar.get(cookieKey)?.value

    if (existing && config.variants.includes(existing)) return existing

    const assigned = weightedPick(config.variants, config.split)
    jar.set(cookieKey, assigned, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    })
    return assigned
  } catch {
    // Edge Config not configured or unavailable — return null (shows control)
    return null
  }
}

/**
 * Reads the already-assigned variant from the cookie without
 * reassigning. Safe to call from client-compatible server utilities.
 */
export async function peekVariant(testId: string): Promise<string | null> {
  try {
    const jar = await cookies()
    return jar.get(`ds_ab_${testId}`)?.value ?? null
  } catch {
    return null
  }
}
