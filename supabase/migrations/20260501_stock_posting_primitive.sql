-- Phase 1: Posting primitive — tables, constraints, RLS.
--
-- Creates the core inventory-v2 schema:
--   stock_warehouses, stock_documents, stock_document_items,
--   stock_lots, stock_lot_consumption, stock_warehouse_permissions
--
-- Also adds warehouse_id to material_inventory and relaxes the hard
-- current_quantity >= 0 check (allow_negative_balance toggle owns enforcement).
--
-- RPCs live in 20260501_stock_posting_rpcs.sql (separate file for clarity).
-- Backfill / topology seed in 20260501_stock_backfill.sql.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Warehouses
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_warehouses (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk             TEXT        NOT NULL,
  name_en             TEXT,
  name_pl             TEXT,
  kind                TEXT        NOT NULL CHECK (kind IN ('main','cabinet','doctor','other')),
  is_main             BOOLEAN     NOT NULL DEFAULT false,
  responsible_user_id UUID        REFERENCES public.admin_users(id) ON DELETE SET NULL,
  cabinet_id          UUID,
  doctor_id           UUID        REFERENCES public.doctors(id) ON DELETE SET NULL,
  sort_order          INT         NOT NULL DEFAULT 0,
  comment             TEXT,
  is_archived         BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 3-tier invariants (Q1 lock 2026-04-22):
  --   main    → exactly one, is_main=true, no doctor, no cabinet
  --   cabinet → is_main=false, no doctor
  --   doctor  → is_main=false, doctor_id required, no cabinet
  CONSTRAINT wh_main_shape    CHECK (kind <> 'main'    OR (is_main = true  AND doctor_id IS NULL AND cabinet_id IS NULL)),
  CONSTRAINT wh_cabinet_shape CHECK (kind <> 'cabinet' OR (is_main = false AND doctor_id IS NULL)),
  CONSTRAINT wh_doctor_shape  CHECK (kind <> 'doctor'  OR (is_main = false AND doctor_id IS NOT NULL AND cabinet_id IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_warehouses_single_main
  ON public.stock_warehouses ((true)) WHERE is_main = true AND is_archived = false;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_warehouses_doctor
  ON public.stock_warehouses (doctor_id) WHERE kind = 'doctor' AND is_archived = false;

ALTER TABLE public.stock_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_wh_admin_rw ON public.stock_warehouses
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Per-warehouse permission matrix (Q6 lock)
--    flags JSONB holds up to 14 boolean capability keys (tooltips 452–477).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_warehouse_permissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  warehouse_id UUID        NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE CASCADE,
  flags        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID        REFERENCES public.admin_users(id) ON DELETE SET NULL,
  UNIQUE (user_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_swp_user ON public.stock_warehouse_permissions (user_id);

ALTER TABLE public.stock_warehouse_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY swp_admin_rw ON public.stock_warehouse_permissions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Documents
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_documents (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type             TEXT         NOT NULL
    CHECK (doc_type IN ('incoming','writeoff','return','transfer','adjustment')),
  doc_number           TEXT         NOT NULL,
  status               TEXT         NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','posted','void')),
  posted_at            TIMESTAMPTZ,
  posted_by            UUID         REFERENCES public.admin_users(id) ON DELETE SET NULL,
  warehouse_from_id    UUID         REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  warehouse_to_id      UUID         REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  supplier_id          UUID         REFERENCES public.material_suppliers(id) ON DELETE SET NULL,
  responsible_user_id  UUID         REFERENCES public.admin_users(id) ON DELETE SET NULL,
  doc_date             DATE         NOT NULL DEFAULT CURRENT_DATE,
  comment              TEXT,
  image_url            TEXT,
  total_amount         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  supplier_order_id    UUID         REFERENCES public.material_orders(id) ON DELETE SET NULL,
  treatment_record_id  UUID         REFERENCES public.treatment_records(id) ON DELETE SET NULL,
  inventory_audit_id   UUID,        -- FK resolved in Phase 6 (ADD CONSTRAINT after audit table)
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT doc_shape CHECK (
    (doc_type='incoming'   AND warehouse_to_id   IS NOT NULL AND warehouse_from_id IS NULL AND supplier_id IS NOT NULL)
    OR
    (doc_type='writeoff'   AND warehouse_from_id IS NOT NULL AND warehouse_to_id   IS NULL)
    OR
    (doc_type='return'     AND warehouse_from_id IS NOT NULL AND warehouse_to_id   IS NULL AND supplier_id IS NOT NULL)
    OR
    (doc_type='transfer'   AND warehouse_from_id IS NOT NULL AND warehouse_to_id   IS NOT NULL AND warehouse_from_id <> warehouse_to_id)
    OR
    (doc_type='adjustment' AND warehouse_from_id IS NOT NULL)
  ),
  UNIQUE (doc_type, doc_number)
);

CREATE INDEX IF NOT EXISTS idx_stock_docs_type_status   ON public.stock_documents (doc_type, status);
CREATE INDEX IF NOT EXISTS idx_stock_docs_wh_from       ON public.stock_documents (warehouse_from_id);
CREATE INDEX IF NOT EXISTS idx_stock_docs_wh_to         ON public.stock_documents (warehouse_to_id);
CREATE INDEX IF NOT EXISTS idx_stock_docs_treatment     ON public.stock_documents (treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_stock_docs_posted_at     ON public.stock_documents (posted_at);

ALTER TABLE public.stock_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_docs_admin_rw ON public.stock_documents
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Document line items
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_document_items (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_document_id UUID         NOT NULL REFERENCES public.stock_documents(id) ON DELETE CASCADE,
  material_id       UUID         NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  pack_qty          NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_qty          NUMERIC(14,4) NOT NULL,
  unit_cost         NUMERIC(14,4) NOT NULL DEFAULT 0,
  line_total        NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sdi_doc ON public.stock_document_items (stock_document_id);
CREATE INDEX IF NOT EXISTS idx_sdi_mat ON public.stock_document_items (material_id);

ALTER TABLE public.stock_document_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_items_admin_rw ON public.stock_document_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FIFO lot book
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_lots (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id        UUID         NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  warehouse_id       UUID         NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  source_document_id UUID         NOT NULL REFERENCES public.stock_documents(id) ON DELETE RESTRICT,
  received_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  unit_cost          NUMERIC(14,4) NOT NULL CHECK (unit_cost >= 0),
  qty_initial        NUMERIC(14,4) NOT NULL CHECK (qty_initial > 0),
  qty_remaining      NUMERIC(14,4) NOT NULL CHECK (qty_remaining >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lots_fifo
  ON public.stock_lots (material_id, warehouse_id, received_at) WHERE qty_remaining > 0;

ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_lots_admin_r     ON public.stock_lots FOR SELECT USING (public.is_admin());
CREATE POLICY stock_lots_block_write ON public.stock_lots FOR INSERT WITH CHECK (false);
CREATE POLICY stock_lots_block_upd   ON public.stock_lots FOR UPDATE USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Lot consumption trail
--    lot_id is nullable: NULL = ghost row when allow_negative_balance=true
--    and stock runs out.  Ghost rows have unit_cost=0 (constrained below).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_lot_consumption (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_document_item_id UUID        NOT NULL REFERENCES public.stock_document_items(id) ON DELETE CASCADE,
  lot_id                UUID         REFERENCES public.stock_lots(id) ON DELETE RESTRICT,
  unit_qty              NUMERIC(14,4) NOT NULL CHECK (unit_qty > 0),
  unit_cost             NUMERIC(14,4) NOT NULL,
  CONSTRAINT ghost_cost CHECK (lot_id IS NOT NULL OR unit_cost = 0)
);

CREATE INDEX IF NOT EXISTS idx_slc_item ON public.stock_lot_consumption (stock_document_item_id);

ALTER TABLE public.stock_lot_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_cons_admin_r     ON public.stock_lot_consumption FOR SELECT USING (public.is_admin());
CREATE POLICY stock_cons_block_write ON public.stock_lot_consumption FOR INSERT WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. material_inventory: add warehouse_id + relax hard negative check
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.material_inventory
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.stock_warehouses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mi_warehouse ON public.material_inventory (warehouse_id);

-- Drop the hard CHECK (current_quantity >= 0) added in 20260321_clinical_and_inventory.sql.
-- allow_negative_balance=true (Q5) requires balances to go below zero during ramp-up;
-- enforcement is now inside post_stock_document() / _drain_lots().
ALTER TABLE public.material_inventory
  DROP CONSTRAINT IF EXISTS material_inventory_current_quantity_check;

ALTER TABLE public.material_inventory
  ADD CONSTRAINT material_inventory_current_quantity_bounded
  CHECK (current_quantity > -1e9);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. material_suppliers — created here if Phase 2 hasn't run yet.
--    Phase 2 adds all the rich fields (legal address, ЄДРПОУ, etc.).
--    Referenced by stock_documents.supplier_id so must exist first.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.material_suppliers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  comment     TEXT,
  is_archived BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.material_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS suppliers_admin_rw ON public.material_suppliers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- doc_number auto-sequencer helper — returns next formatted number for type+year
CREATE OR REPLACE FUNCTION public.next_doc_number(p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix TEXT;
  v_year   TEXT := to_char(now(), 'YY');
  v_n      BIGINT;
BEGIN
  v_prefix := CASE p_doc_type
    WHEN 'incoming'   THEN 'IN'
    WHEN 'writeoff'   THEN 'WO'
    WHEN 'return'     THEN 'RN'
    WHEN 'transfer'   THEN 'TR'
    WHEN 'adjustment' THEN 'ADJ'
    ELSE p_doc_type
  END;

  SELECT COALESCE(MAX(
    (regexp_match(doc_number, v_prefix || '-' || v_year || '-([0-9]+)'))[1]::bigint
  ), 0) + 1
  INTO v_n
  FROM stock_documents
  WHERE doc_type = p_doc_type
    AND doc_number LIKE v_prefix || '-' || v_year || '-%';

  RETURN v_prefix || '-' || v_year || '-' || lpad(v_n::text, 7, '0');
END; $$;

COMMIT;
