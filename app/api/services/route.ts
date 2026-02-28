import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('price_uah', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Помилка завантаження послуг' },
        { status: 500 }
      )
    }

    // Group services by category
    const grouped = services?.reduce((acc, service) => {
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
    }, {} as Record<string, typeof services>)

    return NextResponse.json({
      success: true,
      data: {
        services: services || [],
        grouped: grouped || {},
        categories: Object.keys(grouped || {}),
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
