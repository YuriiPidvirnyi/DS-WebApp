import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAdminAccess, type AdminAccess } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ClinicSettings, WriteoffMode } from '@/types/stock'

export type StockAdminResult =
  | { supabase: SupabaseClient; user: User; access: AdminAccess }
  | { error: NextResponse }

export async function requireStockAdmin(): Promise<StockAdminResult> {
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
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Потрібна авторизація' },
        { status: 401 }
      ),
    }
  }

  const access = await getAdminAccess(supabase, user.id)
  if (!access) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Недостатньо прав доступу' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user, access }
}

export function stockNotFound(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Не знайдено' },
    { status: 404 }
  )
}

export function stockLocked(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Документ вже проведено',
      code: 'STOCK_LOCKED_POSTED',
    },
    { status: 409 }
  )
}

export function flagOff(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Inventory v2 не активовано' },
    { status: 404 }
  )
}

export function isV2On(): boolean {
  return process.env.NEXT_PUBLIC_INVENTORY_V2_ENABLED === 'true'
}

export async function getClinicSetting<T>(
  supabase: SupabaseClient,
  key: string
): Promise<T | null> {
  const { data } = await supabase
    .from('clinic_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return data ? (data.value as T) : null
}

export async function getAllClinicSettings(
  supabase: SupabaseClient
): Promise<ClinicSettings> {
  const { data } = await supabase.from('clinic_settings').select('key, value')
  const map: Record<string, unknown> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return {
    allow_negative_balance: Boolean(map.allow_negative_balance ?? false),
    writeoff_mode: (map.writeoff_mode as WriteoffMode) ?? 'none',
    auto_ap_bill_on_incoming: Boolean(map.auto_ap_bill_on_incoming ?? false),
    default_expense_category_id:
      (map.default_expense_category_id as string | null) ?? null,
    enforce_stock_permissions: Boolean(map.enforce_stock_permissions ?? true),
    show_my_inventory: Boolean(map.show_my_inventory ?? true),
  }
}

/** Resolves doctor's cabinet or main warehouse for writeoff auto-seeding */
export async function resolveDoctorCabinetWarehouse(
  supabase: SupabaseClient,
  doctorId: string
): Promise<string | null> {
  // Prefer doctor satellite warehouse
  const { data: sat } = await supabase
    .from('stock_warehouses')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('is_archived', false)
    .maybeSingle()
  if (sat) return sat.id

  // Fall back to main warehouse
  const { data: main } = await supabase
    .from('stock_warehouses')
    .select('id')
    .eq('is_main', true)
    .eq('is_archived', false)
    .maybeSingle()
  return main?.id ?? null
}
