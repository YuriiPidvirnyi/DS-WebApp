import { NextRequest, NextResponse } from 'next/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/api-security'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

/** POST /api/materials/:id/upload-image */
export async function POST(request: NextRequest, { params }: Params) {
  const { allowed, remaining } = await checkRateLimit(request, 10, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Сервіс тимчасово недоступний' },
      { status: 503 }
    )
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Потрібна авторизація' },
      { status: 401 }
    )
  }

  const access = await getAdminAccess(supabase, user.id)
  if (!access || !hasPermission(access.role, 'inventory:edit')) {
    return NextResponse.json(
      { success: false, error: 'Недостатньо прав' },
      { status: 403 }
    )
  }

  const { id } = await params

  // Validate material exists
  const { data: material } = await supabase
    .from('materials')
    .select('id, image_url')
    .eq('id', id)
    .maybeSingle()

  if (!material) {
    return NextResponse.json(
      { success: false, error: 'Матеріал не знайдено' },
      { status: 404 }
    )
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Очікується multipart/form-data' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'Поле "file" відсутнє або не є файлом' },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Дозволені формати: JPEG, PNG, WebP' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Максимальний розмір файлу: 2 МБ' },
      { status: 400 }
    )
  }

  const ext =
    file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const fileName = `${id}.${ext}`

  try {
    // Delete old image if exists
    if (material.image_url) {
      const oldPath = material.image_url.split('/material-images/')[1]
      if (oldPath) {
        await supabase.storage.from('material-images').remove([oldPath])
      }
    }

    // Upload new image
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from('material-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('material-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Update material record
    const { error: updateError } = await supabase
      .from('materials')
      .update({ image_url: imageUrl })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, data: { imageUrl } })
  } catch (err) {
    captureException(err instanceof Error ? err : new Error(String(err)), {
      context: 'materials/upload-image',
    })
    return NextResponse.json(
      { success: false, error: 'Не вдалося завантажити зображення' },
      { status: 500 }
    )
  }
}
