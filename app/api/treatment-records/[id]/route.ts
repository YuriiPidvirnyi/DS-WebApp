import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import { hasPermission, hasDoctorScope } from '@/lib/permissions'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { captureException } from '@/utils/sentry'
import {
  isV2On,
  getClinicSetting,
  resolveDoctorCabinetWarehouse,
} from '@/lib/stock-helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Fire writeoff hook when a treatment transitions to `completed`. Never throws. */
async function tryWriteoffHook(
  supabase: SupabaseClient,
  treatmentId: string,
  doctorId: string | null,
  responsibleUserId: string
) {
  if (!isV2On()) return
  try {
    const mode = await getClinicSetting<string>(supabase, 'writeoff_mode')
    if (!mode || mode === 'none') return

    const warehouseId = doctorId
      ? await resolveDoctorCabinetWarehouse(supabase, doctorId)
      : null
    if (!warehouseId) return

    const { data: docId, error: draftErr } = await supabase.rpc(
      'create_writeoff_draft_for_treatment',
      {
        p_treatment_record_id: treatmentId,
        p_warehouse_id: warehouseId,
        p_responsible_user_id: responsibleUserId,
      }
    )
    if (draftErr) throw draftErr

    if (mode === 'auto' && docId) {
      const { error: postErr } = await supabase.rpc('post_stock_document', {
        p_doc_id: docId,
      })
      if (postErr) {
        captureException(postErr, {
          extra: { treatment: treatmentId, doc: docId, phase: 'auto-post' },
        })
      }
    }
  } catch (e) {
    captureException(
      e instanceof Error
        ? e
        : new Error('[treatment-records] writeoff-hook failed'),
      { extra: { treatmentId } }
    )
  }
}

type Params = { params: Promise<{ id: string }> }

const DETAIL_SELECT =
  'id, appointment_id, patient_id, doctor_id, tooth_numbers, diagnosis, notes, status, total_cost, payment_status, attachment_urls, created_at, patients(first_name,last_name), doctors(first_name,last_name), treatment_record_items(id, service_id, tooth_number, quantity, price_at_time, notes, services(name_uk)), treatment_materials_used(id, material_id, quantity_used, registered_by, created_at, materials(name_uk))'

const UPDATED_SELECT =
  'id, appointment_id, patient_id, doctor_id, tooth_numbers, diagnosis, notes, status, total_cost, payment_status, attachment_urls, created_at, patients(first_name,last_name), doctors(first_name,last_name), treatment_record_items(id, service_id, tooth_number, quantity, price_at_time, notes, services(name_uk)), treatment_materials_used(id, material_id, quantity_used, registered_by, created_at, materials(name_uk))'

type ItemInput = {
  serviceId: string
  toothNumber?: string | null
  quantity?: number
  priceAtTime: number | string
}

function isItemInput(x: unknown): x is ItemInput {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.serviceId === 'string' &&
    o.serviceId.length > 0 &&
    o.priceAtTime !== undefined &&
    (typeof o.priceAtTime === 'number' || typeof o.priceAtTime === 'string')
  )
}

function computeTotalCost(items: ItemInput[]): number {
  return items.reduce((sum, item) => {
    const qty = item.quantity ?? 1
    const price = Number(item.priceAtTime)
    if (!Number.isFinite(price) || price < 0) return sum
    if (!Number.isFinite(qty) || qty <= 0) return sum
    return sum + qty * price
  }, 0)
}

async function requireAdmin() {
  const supabase = await createClient()
  if (!supabase) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Сервіс тимчасово недоступний' },
        { status: 503 }
      ),
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const adminAccess = await getAdminAccess(supabase, user.id)
  if (!adminAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user, access: adminAccess }
}

/** GET /api/treatment-records/:id — admin or owning patient */
export async function GET(request: NextRequest, { params }: Params) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
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

    const { id } = await params

    const { data, error } = await supabase
      .from('treatment_records')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      captureException(
        new Error('[treatment-records/[id]] Supabase GET error'),
        {
          supabaseError: error,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося завантажити картку лікування' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Картку не знайдено' },
        { status: 404 }
      )
    }

    const adminAccess = await getAdminAccess(supabase, user.id)
    if (!adminAccess && data.patient_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[treatment-records/[id]] GET unexpected')
    )
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

/** PATCH /api/treatment-records/:id — admin-only */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const auth = await requireAdmin()
    if ('error' in auth && auth.error) return auth.error

    if (!hasPermission(auth.access!.role, 'treatments:edit_draft')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Doctor scope: verify ownership before allowing edit
    if (hasDoctorScope(auth.access!.role)) {
      const { data: record } = await auth
        .supabase!.from('treatment_records')
        .select('doctor_id')
        .eq('id', id)
        .maybeSingle()
      if (!record || record.doctor_id !== auth.access!.doctorId) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Невірний формат запиту' },
        { status: 400 }
      )
    }

    // Finalizing an act (draft → signed/completed) requires treatments:sign,
    // not just edit_draft. The UI gates the Sign button on this permission, but
    // enforce it server-side too so a role with only edit_draft (e.g. assistant)
    // cannot PATCH a status transition directly and bypass the gate.
    if (
      (body.status === 'signed' || body.status === 'completed') &&
      !hasPermission(auth.access!.role, 'treatments:sign')
    ) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch the current status once when a status change is requested — used
    // both to enforce the state machine and (for V2) as the writeoff-hook
    // prevStatus.
    let prevStatus: string | null = null
    if (body.status !== undefined) {
      const VALID_STATUSES = ['draft', 'signed', 'completed']
      if (!VALID_STATUSES.includes(body.status as string)) {
        return NextResponse.json(
          { success: false, error: 'Невідомий статус акта' },
          { status: 400 }
        )
      }
      const { data: cur } = await auth
        .supabase!.from('treatment_records')
        .select('status')
        .eq('id', id)
        .maybeSingle()
      prevStatus = (cur?.status as string | undefined) ?? null
      // State machine: draft → signed → completed only. No skipping a step
      // (draft → completed) and no reversal (signed/completed → draft). Same →
      // same is allowed (idempotent). Enforced server-side so a direct API call
      // can't corrupt the act lifecycle regardless of the UI.
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        draft: ['draft', 'signed'],
        signed: ['signed', 'completed'],
        completed: ['completed'],
      }
      if (
        prevStatus &&
        !ALLOWED_TRANSITIONS[prevStatus]?.includes(body.status as string)
      ) {
        return NextResponse.json(
          { success: false, error: 'Неприпустимий перехід статусу акта' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) updates.status = body.status
    if (body.diagnosis !== undefined) updates.diagnosis = body.diagnosis
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.toothNumbers !== undefined)
      updates.tooth_numbers = body.toothNumbers
    if (body.paymentStatus !== undefined)
      updates.payment_status = body.paymentStatus

    const hasItems = 'items' in body
    let itemsPayload: ItemInput[] | null = null
    if (hasItems) {
      if (!Array.isArray(body.items) || !body.items.every(isItemInput)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Поле items має бути масивом об’єктів з serviceId та priceAtTime',
          },
          { status: 400 }
        )
      }
      itemsPayload = body.items as ItemInput[]
      updates.total_cost = computeTotalCost(itemsPayload)
    }

    if (Object.keys(updates).length === 0 && !hasItems) {
      return NextResponse.json(
        { success: false, error: 'Немає полів для оновлення' },
        { status: 400 }
      )
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await auth
        .supabase!.from('treatment_records')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        captureException(
          new Error('[treatment-records/[id]] Supabase PATCH error'),
          {
            supabaseError: updateError,
          }
        )
        return NextResponse.json(
          { success: false, error: 'Не вдалося оновити картку лікування' },
          { status: 500 }
        )
      }
    }

    if (itemsPayload) {
      const { error: delError } = await auth
        .supabase!.from('treatment_record_items')
        .delete()
        .eq('treatment_record_id', id)

      if (delError) {
        captureException(
          new Error('[treatment-records/[id]] Supabase delete items error'),
          {
            supabaseError: delError,
          }
        )
        return NextResponse.json(
          { success: false, error: 'Не вдалося оновити позиції картки' },
          { status: 500 }
        )
      }

      if (itemsPayload.length > 0) {
        const itemRows = itemsPayload.map(item => ({
          treatment_record_id: id,
          service_id: item.serviceId.trim(),
          tooth_number: item.toothNumber?.trim() || null,
          quantity: item.quantity ?? 1,
          price_at_time: Number(item.priceAtTime),
        }))

        const { error: insError } = await auth
          .supabase!.from('treatment_record_items')
          .insert(itemRows)

        if (insError) {
          captureException(
            new Error('[treatment-records/[id]] Supabase insert items error'),
            {
              supabaseError: insError,
            }
          )
          return NextResponse.json(
            { success: false, error: 'Не вдалося зберегти нові позиції' },
            { status: 500 }
          )
        }
      }
    }

    // --- Handle materials used (consumption tracking) ---
    if (Array.isArray(body.materialsUsed)) {
      const materialsUsed = body.materialsUsed as Array<{
        materialId: string
        quantityUsed: number
      }>

      // Reverse previous deductions: load existing entries and add back
      const { data: oldMaterials } = await auth
        .supabase!.from('treatment_materials_used')
        .select('material_id, quantity_used')
        .eq('treatment_record_id', id)

      if (oldMaterials?.length) {
        for (const old of oldMaterials) {
          await auth.supabase!.rpc('add_inventory', {
            p_material_id: old.material_id,
            p_qty: Number(old.quantity_used),
            p_location: '',
          })
        }
      }

      // Delete old entries
      await auth
        .supabase!.from('treatment_materials_used')
        .delete()
        .eq('treatment_record_id', id)

      // Insert new entries and deduct inventory
      if (materialsUsed.length > 0) {
        const matRows = materialsUsed
          .filter(m => m.materialId && Number(m.quantityUsed) > 0)
          .map(m => ({
            treatment_record_id: id,
            material_id: m.materialId,
            quantity_used: Number(m.quantityUsed),
            registered_by: auth.user!.id,
          }))

        if (matRows.length > 0) {
          const { error: matInsErr } = await auth
            .supabase!.from('treatment_materials_used')
            .insert(matRows)

          if (matInsErr) {
            captureException(
              new Error('[treatment-records/[id]] insert materials used'),
              { supabaseError: matInsErr }
            )
            return NextResponse.json(
              {
                success: false,
                error: 'Не вдалося зберегти використані матеріали',
              },
              { status: 500 }
            )
          }

          // Deduct from inventory
          for (const m of materialsUsed.filter(
            x => x.materialId && Number(x.quantityUsed) > 0
          )) {
            await auth.supabase!.rpc('deduct_inventory', {
              p_material_id: m.materialId,
              p_qty: Number(m.quantityUsed),
              p_location: '',
            })
          }
        }
      }
    }

    const { data: full, error: fetchError } = await auth
      .supabase!.from('treatment_records')
      .select(UPDATED_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      captureException(
        new Error('[treatment-records/[id]] Supabase fetch after PATCH'),
        {
          supabaseError: fetchError,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося завантажити оновлену картку' },
        { status: 500 }
      )
    }

    if (!full) {
      return NextResponse.json(
        { success: false, error: 'Картку не знайдено' },
        { status: 404 }
      )
    }

    // Writeoff hook: fires when treatment becomes completed (non-blocking)
    if (updates.status === 'completed' && prevStatus !== 'completed') {
      await tryWriteoffHook(
        auth.supabase!,
        id,
        (full as { doctor_id?: string | null }).doctor_id ?? null,
        auth.user!.id
      )
    }

    return NextResponse.json({ success: true, data: full })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[treatment-records/[id]] PATCH unexpected')
    )
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

/** DELETE /api/treatment-records/:id — admin-only */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 15, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const auth = await requireAdmin()
    if ('error' in auth && auth.error) return auth.error

    if (!hasPermission(auth.access!.role, 'treatments:edit_draft')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Doctor scope: verify ownership before allowing delete
    if (hasDoctorScope(auth.access!.role)) {
      const { data: record } = await auth
        .supabase!.from('treatment_records')
        .select('doctor_id')
        .eq('id', id)
        .maybeSingle()
      if (!record || record.doctor_id !== auth.access!.doctorId) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const { error } = await auth
      .supabase!.from('treatment_records')
      .delete()
      .eq('id', id)

    if (error) {
      captureException(
        new Error('[treatment-records/[id]] Supabase DELETE error'),
        {
          supabaseError: error,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося видалити картку лікування' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[treatment-records/[id]] DELETE unexpected')
    )
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
