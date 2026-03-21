import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Returns a singleton Supabase browser client.
 * Safe to call in hooks — always returns the same reference.
 */
export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  client = createBrowserClient(url, key)
  return client
}
