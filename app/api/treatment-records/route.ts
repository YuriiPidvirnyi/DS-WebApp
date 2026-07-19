import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminAccess } from '@/lib/supabase/admin'
import {
  hasPermission,
  hasAnyPermission,
  hasDoctorScope,
} from '@/lib/permissions'
import {
  checkRateLimit,
  rateLimitResponse,
  validateCSRF,
  csrfErrorResponse,
} from '@/lib/api-security'
import { parsePagination, paginationMeta } from '@/lib/pagination'
import { captureException } from '@/utils/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIST_SELECT =
  'id, appointment_id, patient_id, doctor_id, tooth_numbers, diagnosis, notes, status, total_cost, payment_status, created_at, patients(first_name,last_name), doctors(first_name,last_name), treatment_record_items(service_id, tooth_number, quantity, price_at_time, services(name_uk)), treatment_materials_used(material_id, quantity_used)'

const CREATED_SELECT =
  'id, appointment_id, patient_id, doctor_id, tooth_numbers, diagnosis, notes, status, total_cost, payment_status, created_at, patients(first_name,last_name), doctors(first_name,last_name), treatment_record_items(service_id, tooth_number, quantity, price_at_time, services(name_uk))'

type ItemInput = {
  serviceId: string
  toothNumber?: string | null
  quantity?: number
  priceAtTime: number | string
}

type CreateBody = {
  appointmentId?: string | null
  patientId: string
  doctorId: string
  toothNumbers?: string[] | null
  diagnosis?: string | null
  notes?: string | null
  items: ItemInput[]
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

function isCreateBody(body: unknown): body is CreateBody {
  if (!body || typeof body !== 'object') return false
  const o = body as Record<string, unknown>
  if (typeof o.patientId !== 'string' || typeof o.doctorId !== 'string')
    return false
  if (!Array.isArray(o.items)) return false
  return o.items.every(isItemInput)
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

/** GET /api/treatment-records — admin-only list */
export async function GET(request: NextRequest) {
  const { allowed, remaining } = await checkRateLimit(request, 30, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const auth = await requireAdmin()
    if ('error' in auth && auth.error) return auth.error

    if (
      !hasAnyPermission(auth.access!.role, [
        'treatments:view_all',
        'treatments:view_own',
      ])
    ) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = request.nextUrl
    const { page, pageSize, from, to } = parsePagination(searchParams)

    let query = auth
      .supabase!.from('treatment_records')
      .select(LIST_SELECT, { count: 'exact' })

    const patientId = searchParams.get('patientId')
    if (patientId) query = query.eq('patient_id', patientId)

    // Narrow to a single appointment's act(s) — lets the workspace fetch just
    // the record it needs instead of a patient's whole history then filtering
    // client-side.
    const appointmentId = searchParams.get('appointmentId')
    if (appointmentId) query = query.eq('appointment_id', appointmentId)

    const status = searchParams.get('status')
    if (status) query = query.eq('status', status)

    // Doctors see only their own treatment records
    if (auth.access.role === 'doctor') {
      if (!auth.access.doctorId) {
        return NextResponse.json(
          { success: false, error: "Лікар не прив'язаний до запису в системі" },
          { status: 403 }
        )
      }
      query = query.eq('doctor_id', auth.access.doctorId)
    } else {
      const doctorId = searchParams.get('doctorId')
      if (doctorId) query = query.eq('doctor_id', doctorId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      captureException(
        new Error('[treatment-records] Supabase GET list error'),
        {
          supabaseError: error,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося завантажити картки лікування' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      meta: paginationMeta(page, pageSize, count),
    })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[treatment-records] GET unexpected')
    )
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

/** POST /api/treatment-records — admin-only create */
export async function POST(request: NextRequest) {
  if (!validateCSRF(request)) return csrfErrorResponse()

  const { allowed, remaining } = await checkRateLimit(request, 20, 60_000)
  if (!allowed) return rateLimitResponse(remaining)

  try {
    const auth = await requireAdmin()
    if ('error' in auth && auth.error) return auth.error

    if (!hasPermission(auth.access!.role, 'treatments:create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Невірний формат запиту' },
        { status: 400 }
      )
    }

    if (!isCreateBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Очікується patientId, doctorId та items (масив позицій з serviceId та priceAtTime)',
        },
        { status: 400 }
      )
    }

    // Doctor scope: a doctor may only file acts attributed to themselves —
    // mirrors the ownership check already enforced on PATCH/DELETE so a doctor
    // can't POST an act under another doctor's id (review #2).
    if (
      hasDoctorScope(auth.access!.role) &&
      body.doctorId.trim() !== auth.access!.doctorId
    ) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Doctor scope: when the act targets an appointment, that appointment — and
    // its patient — must actually belong to this doctor. Without this a doctor
    // could self-assign doctorId yet file the act against an appointment/patient
    // they were never assigned (review #6). The self-check above only proves the
    // doctorId isn't spoofed, not that the appointment/patient are theirs.
    if (hasDoctorScope(auth.access!.role) && body.appointmentId) {
      const { data: appt } = await auth
        .supabase!.from('appointments')
        .select('doctor_id, patient_id')
        .eq('id', body.appointmentId.trim())
        .maybeSingle()
      if (
        !appt ||
        appt.doctor_id !== auth.access!.doctorId ||
        (appt.patient_id && appt.patient_id !== body.patientId.trim())
      ) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const totalCost = computeTotalCost(body.items)
    const toothNumbers = Array.isArray(body.toothNumbers)
      ? body.toothNumbers
      : []

    const insertRow = {
      appointment_id: body.appointmentId?.trim() || null,
      patient_id: body.patientId.trim(),
      doctor_id: body.doctorId.trim(),
      tooth_numbers: toothNumbers,
      diagnosis: body.diagnosis?.trim() || null,
      notes: body.notes?.trim() || null,
      total_cost: totalCost,
    }

    const { data: created, error: insertError } = await auth
      .supabase!.from('treatment_records')
      .insert(insertRow)
      .select('id')
      .single()

    if (insertError || !created) {
      captureException(
        new Error('[treatment-records] Supabase insert record error'),
        {
          supabaseError: insertError,
        }
      )
      return NextResponse.json(
        { success: false, error: 'Не вдалося створити картку лікування' },
        { status: 500 }
      )
    }

    const recordId = created.id as string

    if (body.items.length > 0) {
      const itemRows = body.items.map(item => ({
        treatment_record_id: recordId,
        service_id: item.serviceId.trim(),
        tooth_number: item.toothNumber?.trim() || null,
        quantity: item.quantity ?? 1,
        price_at_time: Number(item.priceAtTime),
      }))

      const { error: itemsError } = await auth
        .supabase!.from('treatment_record_items')
        .insert(itemRows)

      if (itemsError) {
        captureException(
          new Error('[treatment-records] Supabase insert items error'),
          {
            supabaseError: itemsError,
          }
        )
        await auth
          .supabase!.from('treatment_records')
          .delete()
          .eq('id', recordId)
        return NextResponse.json(
          {
            success: false,
            error: 'Не вдалося додати позиції картки лікування',
          },
          { status: 500 }
        )
      }
    }

    // --- Handle materials used (consumption tracking) ---
    const materialsUsed = (body as Record<string, unknown>).materialsUsed
    if (Array.isArray(materialsUsed) && materialsUsed.length > 0) {
      const matRows = (
        materialsUsed as Array<{ materialId: string; quantityUsed: number }>
      )
        .filter(m => m.materialId && Number(m.quantityUsed) > 0)
        .map(m => ({
          treatment_record_id: recordId,
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
            new Error('[treatment-records] insert materials used error'),
            { supabaseError: matInsErr }
          )
        } else {
          // Deduct from inventory
          for (const m of materialsUsed as Array<{
            materialId: string
            quantityUsed: number
          }>) {
            if (m.materialId && Number(m.quantityUsed) > 0) {
              const { error: rpcErr } = await auth.supabase!.rpc(
                'deduct_inventory',
                {
                  p_material_id: m.materialId,
                  p_qty: Number(m.quantityUsed),
                  p_location: '',
                }
              )
              if (rpcErr) {
                captureException(
                  new Error('[treatment-records] deduct_inventory RPC error'),
                  { supabaseError: rpcErr, materialId: m.materialId }
                )
              }
            }
          }
        }
      }
    }

    const { data: full, error: fetchError } = await auth
      .supabase!.from('treatment_records')
      .select(CREATED_SELECT)
      .eq('id', recordId)
      .single()

    if (fetchError || !full) {
      captureException(
        new Error('[treatment-records] Supabase fetch created error'),
        {
          supabaseError: fetchError,
        }
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Картку створено, але не вдалося завантажити дані',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: full }, { status: 201 })
  } catch (err) {
    captureException(
      err instanceof Error
        ? err
        : new Error('[treatment-records] POST unexpected')
    )
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
