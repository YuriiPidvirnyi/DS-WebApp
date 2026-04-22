export type DocType =
  | 'incoming'
  | 'writeoff'
  | 'return'
  | 'transfer'
  | 'adjustment'
export type DocStatus = 'draft' | 'posted' | 'void'
export type WarehouseKind = 'main' | 'cabinet' | 'doctor' | 'other'

export interface StockWarehouse {
  id: string
  name_uk: string
  name_en: string | null
  name_pl: string | null
  kind: WarehouseKind
  is_main: boolean
  responsible_user_id: string | null
  doctor_id: string | null
  sort_order: number
  comment: string | null
  is_archived: boolean
  created_at: string
}

export interface StockDocument {
  id: string
  doc_type: DocType
  doc_number: string
  status: DocStatus
  posted_at: string | null
  posted_by: string | null
  warehouse_from_id: string | null
  warehouse_to_id: string | null
  supplier_id: string | null
  responsible_user_id: string | null
  doc_date: string
  comment: string | null
  image_url: string | null
  total_amount: number
  supplier_order_id: string | null
  treatment_record_id: string | null
  created_at: string
}

export interface StockDocumentItem {
  id: string
  stock_document_id: string
  material_id: string
  pack_qty: number
  unit_qty: number
  unit_cost: number
  line_total: number
}

export interface StockDocumentWithItems extends StockDocument {
  items: StockDocumentItem[]
}

export interface StockLot {
  id: string
  material_id: string
  warehouse_id: string
  source_document_id: string
  received_at: string
  unit_cost: number
  qty_initial: number
  qty_remaining: number
}

/** Permission flags per tooltip refs 452–477 */
export interface WarehousePermissionFlags {
  manage_warehouses?: boolean // 452
  edit_brands?: boolean // 453
  edit_products?: boolean // 454
  edit_categories?: boolean // 455
  edit_suppliers?: boolean // 456
  manage_permissions?: boolean // 457
  manage_calc_cards?: boolean // 458
  manage_settings?: boolean // 459
  view_other_balances?: boolean // 461
  base_access?: boolean // 462
  view_incoming?: boolean // 466
  edit_incoming?: boolean // 467
  view_return?: boolean // 468
  edit_return?: boolean // 469
  view_transfer?: boolean // 470
  edit_transfer?: boolean // 471
  view_writeoff?: boolean // 472
  create_writeoff?: boolean // 473
  unpost_writeoff?: boolean // 474
  delete_draft_writeoff?: boolean // 475
  view_audit?: boolean // 476
  post_audit?: boolean // 477
}

export interface StockWarehousePermission {
  id: string
  user_id: string
  warehouse_id: string
  flags: WarehousePermissionFlags
  updated_at: string
  updated_by: string | null
}

export interface ClinicSetting {
  key: string
  value: unknown
  updated_at: string
  updated_by: string | null
}

export type WriteoffMode = 'none' | 'draft_hybrid' | 'auto'

export interface ClinicSettings {
  allow_negative_balance: boolean
  writeoff_mode: WriteoffMode
  auto_ap_bill_on_incoming: boolean
  default_expense_category_id: string | null
  enforce_stock_permissions: boolean
  show_my_inventory: boolean
}

export interface MaterialBalance {
  material_id: string
  warehouse_id: string
  current_quantity: number
  critical_level_unit_qty: number | null
  default_reorder_unit_qty: number | null
  is_visible: boolean
  material: {
    id: string
    name_uk: string
    name_en: string | null
    image_url: string | null
    unit: string
  }
  warehouse: { id: string; name_uk: string; kind: WarehouseKind }
}
