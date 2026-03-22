import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const revalidate = 60

export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 60, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      )
    }

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('price_uah', { ascending: true })

    if (error) {
      captureException(new Error('[services] Supabase GET error'), {
        supabaseError: error,
      })
      return NextResponse.json(
        { success: false, error: 'Помилка завантаження послуг' },
        { status: 500 }
      )
    }

    // Group services by category
    const grouped = services?.reduce(
      (acc, service) => {
        const category = service.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push({
          id: service.id,
          name: service.name_uk,
          description: service.description_uk,
          price: service.price_uah,
          duration: service.duration_minutes,
        })
        return acc
      },
      {} as Record<string, typeof services>
    )

    return NextResponse.json({
      success: true,
      data: {
        services: services || [],
        grouped: grouped || {},
        categories: Object.keys(grouped || {}),
      },
    })
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
