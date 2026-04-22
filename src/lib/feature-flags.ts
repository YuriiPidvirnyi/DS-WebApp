/**
 * Feature-flag readers for the inventory-v2 rollout.
 *
 * The flag is an env var rather than a DB row so it can be toggled per-environment
 * (dev on, preprod on, prod off) without a migration.  This is the first feature
 * flag in this repo — the pattern is: env var controls visibility, DB clinic_settings
 * controls runtime behaviour once the feature is visible.
 *
 * Server-side:  import { isInventoryV2Enabled } from '@/lib/feature-flags'
 * Client-side:  import { isInventoryV2EnabledClient } from '@/lib/feature-flags'
 */

/** Server-side: reads process.env directly (safe in RSC, API routes, middleware). */
export function isInventoryV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_INVENTORY_V2_ENABLED === 'true'
}

/**
 * Client-side: reads the NEXT_PUBLIC_ var inlined by Next.js at build time.
 * Identical logic, separate export so the intent is explicit at the call site.
 */
export function isInventoryV2EnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_INVENTORY_V2_ENABLED === 'true'
}
