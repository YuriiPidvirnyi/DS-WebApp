import { NextRequest, NextResponse } from 'next/server'
import {
  createContact,
  CliniCardsError,
  type ContactPayload,
} from '@/lib/clinicards-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/contacts */
export async function POST(request: NextRequest) {
  let body: Partial<ContactPayload>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Невірний формат запиту' },
      { status: 400 }
    )
  }

  // Required: firstName + phone
  if (!body.firstName?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Поле firstName є обов\'язковим' },
      { status: 400 }
    )
  }
  if (!body.phone?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Поле phone є обов\'язковим' },
      { status: 400 }
    )
  }

  try {
    const data = await createContact(body as ContactPayload)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof CliniCardsError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }
    console.error('[contacts] unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
