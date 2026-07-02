BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 6: Inventory audits
-- Tables: inventory_audits, inventory_audit_items
-- FK:     stock_documents.inventory_audit_id → inventory_audits
-- RPCs:   initialise_audit_items, post_inventory_audit
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inventory_audits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number          TEXT UNIQUE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'posted', 'void')),
  responsible_user_id   UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
  warehouse_ids         UUID[] NOT NULL,
  category_ids          UUID[] NOT NULL DEFAULT '{}',
  brand_ids             UUID[] NOT NULL DEFAULT '{}',
  material_ids          UUID[] NOT NULL DEFAULT '{}',
  audit_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  comment               TEXT,
  adjustment_document_id UUID REFERENCES public.stock_documents(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at             TIMESTAMPTZ,
  posted_by             UUID REFERENCES public.admin_users(id)
);

CREATE TABLE IF NOT EXISTS public.inventory_audit_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id      UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  material_id   UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  warehouse_id  UUID NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE RESTRICT,
  qty_before    NUMERIC(14,4) NOT NULL,
  qty_actual    NUMERIC(14,4),
  UNIQUE (audit_id, material_id, warehouse_id)
);

-- Wire up the FK that was deferred in Phase 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_documents_audit_fk'
      AND table_name = 'stock_documents'
  ) THEN
    ALTER TABLE public.stock_documents
      ADD CONSTRAINT stock_documents_audit_fk
      FOREIGN KEY (inventory_audit_id) REFERENCES public.inventory_audits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS
ALTER TABLE public.inventory_audits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_audits' AND policyname = 'audit_admin_rw'
  ) THEN
    CREATE POLICY audit_admin_rw ON public.inventory_audits
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inventory_audit_items' AND policyname = 'audit_items_rw'
  ) THEN
    CREATE POLICY audit_items_rw ON public.inventory_audit_items
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: initialise_audit_items
-- Populates audit items from current material_inventory for the scoped
-- warehouses / categories / brands / materials.  Idempotent (ON CONFLICT DO NOTHING).
-- Returns: number of rows inserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.initialise_audit_items(p_audit_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a RECORD;
  n INT;
BEGIN
  SELECT * INTO a FROM inventory_audits WHERE id = p_audit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Audit % not found', p_audit_id; END IF;
  IF a.status <> 'draft' THEN RAISE EXCEPTION 'Audit % is not draft', p_audit_id; END IF;

  INSERT INTO inventory_audit_items (audit_id, material_id, warehouse_id, qty_before)
  SELECT a.id, mi.material_id, mi.warehouse_id, mi.current_quantity
    FROM material_inventory mi
    JOIN materials m ON m.id = mi.material_id
   WHERE mi.warehouse_id = ANY(a.warehouse_ids)
     AND (cardinality(a.category_ids) = 0 OR m.category_v2_id = ANY(a.category_ids))
     AND (cardinality(a.brand_ids)    = 0 OR m.brand_id        = ANY(a.brand_ids))
     AND (cardinality(a.material_ids) = 0 OR m.id              = ANY(a.material_ids))
     AND m.is_active
  ON CONFLICT (audit_id, material_id, warehouse_id) DO NOTHING;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: post_inventory_audit
-- For each warehouse in the audit scope: creates one ADJ-YY-NNNNNNN
-- stock_document, fills items with (qty_actual - qty_before) deltas,
-- calls post_stock_document to update balances.
-- Returns: audit id.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.post_inventory_audit(p_audit_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a        RECORD;
  wh       UUID;
  v_doc_id UUID;
  v_last_doc_id UUID;
  v_num    TEXT;
BEGIN
  SELECT * INTO a FROM inventory_audits WHERE id = p_audit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Audit % not found', p_audit_id; END IF;
  IF a.status <> 'draft' THEN RAISE EXCEPTION 'Audit % not draft', p_audit_id; END IF;

  FOR wh IN SELECT unnest(a.warehouse_ids) LOOP
    -- Generate human-readable number ADJ-YY-NNNNNNN
    SELECT 'ADJ-' || to_char(now(), 'YY') || '-' ||
           lpad(((COUNT(*) + 1)::text), 7, '0')
      INTO v_num
      FROM stock_documents
     WHERE doc_type = 'adjustment'
       AND doc_number LIKE 'ADJ-' || to_char(now(), 'YY') || '-%';

    INSERT INTO stock_documents (
      doc_type, doc_number, status, warehouse_from_id,
      responsible_user_id, doc_date, inventory_audit_id, comment
    ) VALUES (
      'adjustment', v_num, 'draft', wh,
      a.responsible_user_id, a.audit_date, a.id,
      'Adjustment from audit ' || a.audit_number
    )
    RETURNING id INTO v_doc_id;

    INSERT INTO stock_document_items (
      stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total
    )
    SELECT v_doc_id,
           ai.material_id,
           0,
           (COALESCE(ai.qty_actual, 0) - ai.qty_before),
           0,
           0
      FROM inventory_audit_items ai
     WHERE ai.audit_id = a.id
       AND ai.warehouse_id = wh
       AND ai.qty_actual IS NOT NULL
       AND ai.qty_actual <> ai.qty_before;

    PERFORM public.post_stock_document(v_doc_id);
    v_last_doc_id := v_doc_id;
  END LOOP;

  UPDATE inventory_audits
     SET status                 = 'posted',
         posted_at              = now(),
         posted_by              = auth.uid(),
         adjustment_document_id = v_last_doc_id
   WHERE id = a.id;

  RETURN a.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialise_audit_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_inventory_audit   TO authenticated;

COMMIT;
