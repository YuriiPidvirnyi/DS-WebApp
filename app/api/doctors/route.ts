import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('experience_years', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Помилка завантаження лікарів' },
        { status: 500 }
      )
    }

    // Format doctor names with patronymic (Ukrainian style)
    const formattedDoctors = doctors?.map(doc => ({
      id: doc.id,
      fullName: `${doc.last_name} ${doc.first_name} ${doc.patronymic || ''}`.trim(),
      shortName: `${doc.last_name} ${doc.first_name.charAt(0)}.${doc.patronymic ? ` ${doc.patronymic.charAt(0)}.` : ''}`,
      firstName: doc.first_name,
      lastName: doc.last_name,
      patronymic: doc.patronymic,
      specialization: doc.specialization,
      experience: doc.experience_years,
      education: doc.education,
      bio: doc.bio,
      photo: doc.photo_url,
    }))

    return NextResponse.json({
      success: true,
      data: formattedDoctors || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
