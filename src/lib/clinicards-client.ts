/**
 * Server-side CliniCards API client.
 * This file must only be imported in Route Handlers / Server Components.
 * It uses CLINICARDS_API_KEY and CLINICARDS_API_URL — server-only env vars
 * (no NEXT_PUBLIC_ prefix, never sent to the browser).
 */

const CLINICARDS_BASE_URL =
  process.env.CLINICARDS_API_URL ?? 'https://api.cliniccards.com/v1'

const CLINICARDS_API_KEY = process.env.CLINICARDS_API_KEY ?? ''

const API_TIMEOUT = parseInt(process.env.API_TIMEOUT ?? '10000', 10)
const MAX_RETRIES = 3

export class CliniCardsError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'CliniCardsError'
  }
}

/**
 * Low-level fetch wrapper — retries on 5xx/network errors,
 * attaches auth header, enforces timeout.
 */
async function cliniRequest<T>(
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  if (!CLINICARDS_API_KEY) {
    throw new CliniCardsError(
      'CLINICARDS_API_KEY is not configured',
      500,
      'MISSING_API_KEY'
    )
  }

  const url = `${CLINICARDS_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CLINICARDS_API_KEY}`,
    'X-API-Version': '1.0',
    ...init.headers,
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        // Don't retry 4xx
        if (response.status >= 400 && response.status < 500) {
          throw new CliniCardsError(
            body?.message ?? `HTTP ${response.status}`,
            response.status,
            body?.code
          )
        }
        throw new CliniCardsError(
          body?.message ?? `HTTP ${response.status}`,
          response.status,
          body?.code
        )
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timer)

      if (error instanceof CliniCardsError && error.status < 500) {
        throw error // 4xx — no retry
      }

      lastError = error as Error

      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 250 * Math.pow(2, attempt)))
      }
    }
  }

  throw new CliniCardsError(
    lastError?.message ?? 'Unknown error',
    503,
    'UPSTREAM_ERROR'
  )
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export type SlotsResponse = {
  slots: string[]
  [key: string]: unknown
}

export function getAvailableSlots(doctorId: string, date: string) {
  return cliniRequest<SlotsResponse>(
    `/schedule/slots?doctor_id=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  )
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface ContactPayload {
  firstName: string
  lastName?: string
  phone: string
  email?: string
  message?: string
  source?: string
}

export function createContact(payload: ContactPayload) {
  return cliniRequest<{ id: string }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Health ──────────────────────────────────────────────────────────────────

export function pingCliniCards() {
  return cliniRequest<{ status: string; version: string }>('/health', {
    method: 'GET',
  })
}
