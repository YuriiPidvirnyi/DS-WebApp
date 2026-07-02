-- Phase 1: Posting RPCs.
--
-- All functions are SECURITY DEFINER so they bypass the write-blocks placed
-- on stock_lots and stock_lot_consumption via RLS in
-- 20260501_stock_posting_primitive.sql.
--
-- Entry points (callable by authenticated):
--   post_stock_document(p_doc_id)     → posts any doc type
--   unpost_writeoff_document(p_doc_id, p_reason)  → reverses a posted writeoff
--
-- Internal helpers (not callable directly):
--   _drain_lots(p_doc_id, p_mode)     → FIFO or LIFO drain for writeoff/return
--   _transfer_lots(p_doc_id)          → atomic transfer between warehouses
--   _adjust_lots(p_doc_id)            → signed delta from audit adjustment

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- _drain_lots  — FIFO (writeoff) or LIFO (return)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._drain_lots(p_doc_id UUID, p_mode TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item           RECORD;
  v_lot            RECORD;
  v_need           NUMERIC(14,4);
  v_take           NUMERIC(14,4);
  v_allow_negative BOOLEAN;
  v_warehouse      UUID;
  v_total          NUMERIC(14,2) := 0;
  v_line_cost      NUMERIC(14,2);
  v_order          TEXT;
BEGIN
  IF p_mode NOT IN ('FIFO','LIFO') THEN
    RAISE EXCEPTION '_drain_lots: invalid mode %', p_mode USING ERRCODE='invalid_parameter_value';
  END IF;

  SELECT (value #>> '{}')::boolean INTO v_allow_negative
    FROM clinic_settings WHERE key = 'allow_negative_balance';
  v_allow_negative := COALESCE(v_allow_negative, false);

  SELECT warehouse_from_id INTO v_warehouse FROM stock_documents WHERE id = p_doc_id;
  v_order := CASE WHEN p_mode = 'LIFO' THEN 'DESC' ELSE 'ASC' END;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_need := v_item.unit_qty;
    v_line_cost := 0;

    FOR v_lot IN EXECUTE format(
      'SELECT id, qty_remaining, unit_cost
         FROM stock_lots
        WHERE material_id = $1 AND warehouse_id = $2 AND qty_remaining > 0
        ORDER BY received_at %s
          FOR UPDATE', v_order)
      USING v_item.material_id, v_warehouse
    LOOP
      EXIT WHEN v_need <= 0;
      v_take := LEAST(v_lot.qty_remaining, v_need);

      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);

      UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;
      v_need      := v_need - v_take;
      v_line_cost := v_line_cost + (v_take * v_lot.unit_cost);
    END LOOP;

    IF v_need > 0 THEN
      IF NOT v_allow_negative THEN
        RAISE EXCEPTION 'Insufficient stock for material % on warehouse % (short by %)',
          v_item.material_id, v_warehouse, v_need USING ERRCODE='check_violation';
      END IF;
      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, NULL, v_need, 0);
    END IF;

    UPDATE stock_document_items
       SET unit_cost  = CASE WHEN v_item.unit_qty > 0 THEN v_line_cost / v_item.unit_qty ELSE 0 END,
           line_total = v_line_cost
     WHERE id = v_item.id;

    UPDATE material_inventory
       SET current_quantity = current_quantity - v_item.unit_qty
     WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse;

    v_total := v_total + v_line_cost;
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- _transfer_lots  — cost-basis-preserving transfer
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._transfer_lots(p_doc_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_doc      RECORD;
  v_item     RECORD;
  v_lot      RECORD;
  v_need     NUMERIC(14,4);
  v_take     NUMERIC(14,4);
  v_total    NUMERIC(14,2) := 0;
  v_line_sum NUMERIC(14,2);
BEGIN
  SELECT warehouse_from_id, warehouse_to_id INTO v_doc
    FROM stock_documents WHERE id = p_doc_id;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_need     := v_item.unit_qty;
    v_line_sum := 0;

    FOR v_lot IN
      SELECT id, qty_remaining, unit_cost FROM stock_lots
      WHERE material_id = v_item.material_id AND warehouse_id = v_doc.warehouse_from_id
        AND qty_remaining > 0 ORDER BY received_at ASC FOR UPDATE
    LOOP
      EXIT WHEN v_need <= 0;
      v_take := LEAST(v_lot.qty_remaining, v_need);

      INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
      VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);

      UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;

      INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
      VALUES (v_item.material_id, v_doc.warehouse_to_id, p_doc_id, v_lot.unit_cost, v_take, v_take);

      v_need     := v_need - v_take;
      v_line_sum := v_line_sum + (v_take * v_lot.unit_cost);
    END LOOP;

    IF v_need > 0 THEN
      RAISE EXCEPTION 'Transfer short: material % from warehouse % (need % more)',
        v_item.material_id, v_doc.warehouse_from_id, v_need USING ERRCODE='check_violation';
    END IF;

    UPDATE stock_document_items
       SET unit_cost  = v_line_sum / v_item.unit_qty,
           line_total = v_line_sum
     WHERE id = v_item.id;

    UPDATE material_inventory
       SET current_quantity = current_quantity - v_item.unit_qty
     WHERE material_id = v_item.material_id AND warehouse_id = v_doc.warehouse_from_id;

    INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
      VALUES (v_item.material_id, v_doc.warehouse_to_id, v_item.unit_qty)
    ON CONFLICT (material_id, warehouse_id) DO UPDATE
      SET current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity,
          last_restocked_at = CURRENT_DATE;

    v_total := v_total + v_line_sum;
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- _adjust_lots  — signed delta from audit adjustment
--   unit_qty > 0 → surplus found, create new lot at weighted-avg cost
--   unit_qty < 0 → shortage, drain FIFO (no negative-balance guard — audits fix reality)
--   unit_qty = 0 → no-op
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._adjust_lots(p_doc_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_warehouse UUID;
  v_item      RECORD;
  v_lot       RECORD;
  v_need      NUMERIC(14,4);
  v_take      NUMERIC(14,4);
  v_avg_cost  NUMERIC(14,4);
  v_total     NUMERIC(14,2) := 0;
  v_line_sum  NUMERIC(14,2);
BEGIN
  SELECT warehouse_from_id INTO v_warehouse FROM stock_documents WHERE id = p_doc_id;

  FOR v_item IN
    SELECT id, material_id, unit_qty
      FROM stock_document_items WHERE stock_document_id = p_doc_id
  LOOP
    v_line_sum := 0;

    IF v_item.unit_qty > 0 THEN
      SELECT COALESCE(SUM(qty_remaining * unit_cost) / NULLIF(SUM(qty_remaining), 0), 0)
        INTO v_avg_cost
      FROM stock_lots
      WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse AND qty_remaining > 0;

      INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
      VALUES (v_item.material_id, v_warehouse, p_doc_id, v_avg_cost, v_item.unit_qty, v_item.unit_qty);

      INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
        VALUES (v_item.material_id, v_warehouse, v_item.unit_qty)
      ON CONFLICT (material_id, warehouse_id) DO UPDATE
        SET current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity;

      v_line_sum := v_item.unit_qty * v_avg_cost;

    ELSIF v_item.unit_qty < 0 THEN
      v_need := -v_item.unit_qty;

      FOR v_lot IN
        SELECT id, qty_remaining, unit_cost FROM stock_lots
        WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse
          AND qty_remaining > 0 ORDER BY received_at ASC FOR UPDATE
      LOOP
        EXIT WHEN v_need <= 0;
        v_take := LEAST(v_lot.qty_remaining, v_need);
        INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
          VALUES (v_item.id, v_lot.id, v_take, v_lot.unit_cost);
        UPDATE stock_lots SET qty_remaining = qty_remaining - v_take WHERE id = v_lot.id;
        v_need     := v_need - v_take;
        v_line_sum := v_line_sum + (v_take * v_lot.unit_cost);
      END LOOP;

      IF v_need > 0 THEN
        INSERT INTO stock_lot_consumption (stock_document_item_id, lot_id, unit_qty, unit_cost)
          VALUES (v_item.id, NULL, v_need, 0);
      END IF;

      UPDATE material_inventory
         SET current_quantity = current_quantity + v_item.unit_qty
       WHERE material_id = v_item.material_id AND warehouse_id = v_warehouse;
    END IF;

    UPDATE stock_document_items
       SET unit_cost  = CASE WHEN v_item.unit_qty <> 0 THEN v_line_sum / ABS(v_item.unit_qty) ELSE 0 END,
           line_total = v_line_sum
     WHERE id = v_item.id;

    v_total := v_total + ABS(v_line_sum);
  END LOOP;

  UPDATE stock_documents SET total_amount = v_total WHERE id = p_doc_id;
END; $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- post_stock_document  — main entry point
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.post_stock_document(p_doc_id UUID)
RETURNS public.stock_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d public.stock_documents;
BEGIN
  SELECT * INTO d FROM stock_documents WHERE id = p_doc_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document % not found', p_doc_id USING ERRCODE='no_data_found';
  END IF;
  IF d.status <> 'draft' THEN
    RAISE EXCEPTION 'Document % not in draft (status=%)', p_doc_id, d.status
      USING ERRCODE='check_violation';
  END IF;

  -- Lock balance rows upfront to serialise concurrent posts on the same (material, warehouse).
  PERFORM 1 FROM material_inventory mi
   WHERE mi.warehouse_id IN (d.warehouse_from_id, d.warehouse_to_id)
     AND mi.material_id IN (SELECT material_id FROM stock_document_items WHERE stock_document_id = d.id)
   FOR UPDATE;

  IF d.doc_type = 'incoming' THEN
    INSERT INTO stock_lots (material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
    SELECT sdi.material_id, d.warehouse_to_id, d.id, sdi.unit_cost, sdi.unit_qty, sdi.unit_qty
      FROM stock_document_items sdi WHERE sdi.stock_document_id = d.id;

    INSERT INTO material_inventory (material_id, warehouse_id, current_quantity)
    SELECT sdi.material_id, d.warehouse_to_id, sdi.unit_qty
      FROM stock_document_items sdi WHERE sdi.stock_document_id = d.id
    ON CONFLICT (material_id, warehouse_id) DO UPDATE
      SET current_quantity  = material_inventory.current_quantity + EXCLUDED.current_quantity,
          last_restocked_at = CURRENT_DATE;

    UPDATE stock_documents
       SET total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM stock_document_items WHERE stock_document_id = d.id)
     WHERE id = d.id;

  ELSIF d.doc_type IN ('writeoff', 'return') THEN
    PERFORM public._drain_lots(d.id, CASE d.doc_type WHEN 'writeoff' THEN 'FIFO' ELSE 'LIFO' END);

  ELSIF d.doc_type = 'transfer' THEN
    PERFORM public._transfer_lots(d.id);

  ELSIF d.doc_type = 'adjustment' THEN
    PERFORM public._adjust_lots(d.id);
  END IF;

  UPDATE stock_documents
     SET status = 'posted', posted_at = now(), posted_by = auth.uid()
   WHERE id = p_doc_id
  RETURNING * INTO d;

  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'stock_document.post', 'stock_documents', d.id,
          jsonb_build_object('doc_type', d.doc_type, 'doc_number', d.doc_number, 'total', d.total_amount));

  RETURN d;
END; $$;

REVOKE ALL ON FUNCTION public.post_stock_document FROM public;
GRANT  EXECUTE ON FUNCTION public.post_stock_document TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- unpost_writeoff_document  — reverses a posted writeoff (tooltip 474)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unpost_writeoff_document(p_doc_id UUID, p_reason TEXT)
RETURNS public.stock_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d public.stock_documents;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'unpost_writeoff_document: reason is required (min 3 chars)'
      USING ERRCODE='invalid_parameter_value';
  END IF;

  SELECT * INTO d FROM stock_documents WHERE id = p_doc_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document % not found', p_doc_id USING ERRCODE='no_data_found';
  END IF;
  IF d.doc_type <> 'writeoff' THEN
    RAISE EXCEPTION 'unpost_writeoff_document: only writeoff docs can be un-posted (got %)', d.doc_type
      USING ERRCODE='check_violation';
  END IF;
  IF d.status <> 'posted' THEN
    RAISE EXCEPTION 'unpost_writeoff_document: doc % not posted (status=%)', p_doc_id, d.status
      USING ERRCODE='check_violation';
  END IF;

  PERFORM 1 FROM material_inventory mi
   WHERE mi.warehouse_id = d.warehouse_from_id
     AND mi.material_id IN (SELECT material_id FROM stock_document_items WHERE stock_document_id = d.id)
   FOR UPDATE;

  -- Restore lot qty_remaining from consumption trail.
  UPDATE stock_lots sl
     SET qty_remaining = qty_remaining + slc.unit_qty
    FROM stock_lot_consumption slc
    JOIN stock_document_items sdi ON sdi.id = slc.stock_document_item_id
   WHERE sdi.stock_document_id = d.id AND slc.lot_id = sl.id;

  -- Restore balance.
  UPDATE material_inventory mi
     SET current_quantity = current_quantity + sdi.unit_qty
    FROM stock_document_items sdi
   WHERE sdi.stock_document_id = d.id
     AND mi.material_id = sdi.material_id AND mi.warehouse_id = d.warehouse_from_id;

  DELETE FROM stock_lot_consumption
   WHERE stock_document_item_id IN (SELECT id FROM stock_document_items WHERE stock_document_id = d.id);

  UPDATE stock_documents
     SET status = 'draft', posted_at = NULL, posted_by = NULL
   WHERE id = p_doc_id
  RETURNING * INTO d;

  INSERT INTO admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'stock_document.unpost', 'stock_documents', d.id,
          jsonb_build_object('doc_number', d.doc_number, 'reason', p_reason));

  RETURN d;
END; $$;

REVOKE ALL ON FUNCTION public.unpost_writeoff_document FROM public;
GRANT  EXECUTE ON FUNCTION public.unpost_writeoff_document TO authenticated;

COMMIT;
