import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GenerateLinkPayload = {
  type: 'signup' | 'recovery'
  email: string
  password?: string
  next?: string
}

const HELPERS_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.E2E_AUTH_HELPERS_ENABLED !== 'false'
const HELPERS_SECRET =
  process.env.E2E_AUTH_HELPERS_SECRET ?? 'local-e2e-auth-secret'

function isGenerateLinkPayload(value: unknown): value is GenerateLinkPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Record<string, unknown>
  const type = payload.type
  const email = payload.email
  const password = payload.password
  const next = payload.next

  if (type !== 'signup' && type !== 'recovery') {
    return false
  }

  if (typeof email !== 'string' || email.trim().length === 0) {
    return false
  }

  if (
    type === 'signup' &&
    (typeof password !== 'string' || password.length < 8)
  ) {
    return false
  }

  if (
    next !== undefined &&
    (typeof next !== 'string' || !next.startsWith('/'))
  ) {
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  if (!HELPERS_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (request.headers.get('x-e2e-auth-secret') !== HELPERS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      },
      { status: 500 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isGenerateLinkPayload(payload)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const nextPath =
    payload.next ??
    (payload.type === 'signup' ? '/cabinet' : '/auth/reset-password')
  const redirectTo = new URL('/auth/callback', request.nextUrl.origin)
  redirectTo.searchParams.set('next', nextPath)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.admin.generateLink({
    type: payload.type,
    email: payload.email,
    password: payload.type === 'signup' ? payload.password : undefined,
    options: {
      redirectTo: redirectTo.toString(),
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: 400 }
    )
  }

  return NextResponse.json({
    actionLink: data.properties?.action_link ?? null,
    hashedToken: data.properties?.hashed_token ?? null,
    redirectTo: data.properties?.redirect_to ?? null,
    verificationType: data.properties?.verification_type ?? null,
  })
}

export async function GET(request: NextRequest) {
  if (!HELPERS_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (request.headers.get('x-e2e-auth-secret') !== HELPERS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    enabled: true,
    hasSupabaseConfig: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  })
}
