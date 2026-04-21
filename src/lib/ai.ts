/**
 * Vercel AI Gateway model helper.
 *
 * When `AI_GATEWAY_API_KEY` is set (all Vercel environments), calls are
 * automatically routed through https://ai-gateway.vercel.sh, giving you
 * unified spend monitoring, rate-limit controls, and provider fallbacks
 * without changing the `streamText` / `generateText` call sites.
 *
 * When the env var is absent (local dev without a gateway key), the AI SDK
 * falls back to direct provider calls using whatever key the provider SDK
 * finds (e.g. `OPENAI_API_KEY`).
 *
 * Usage:
 *   import { gatewayModel } from '@/lib/ai'
 *   streamText({ model: gatewayModel('openai/gpt-4o-mini'), ... })
 *
 * Docs: https://vercel.com/docs/ai-gateway/getting-started/text
 */

/**
 * Returns the model identifier string for use with the AI SDK's
 * `streamText` / `generateText`. When `AI_GATEWAY_API_KEY` is present the
 * SDK routes through the Vercel AI Gateway automatically; no wrapper object
 * is needed because the SDK resolves bare "provider/model" strings against
 * the gateway endpoint when the key is set via the standard env var.
 */
export function gatewayModel(modelId: string): string {
  return modelId
}

/**
 * The default chat model used by the AI assistant and recommendation routes.
 * Change in one place to update both routes.
 */
export const DEFAULT_CHAT_MODEL = 'openai/gpt-4o-mini'
