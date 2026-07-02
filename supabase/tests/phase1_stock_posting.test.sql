-- pgTAP Phase 1 — posting primitive, lots, warehouse topology
-- Run after 20260501_stock_posting_primitive.sql + 20260501_stock_posting_rpcs.sql

BEGIN;
SELECT plan(24);

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Schema: tables exist
-- ────────────────────────────────────────────────────────────────────────────
SELECT has_table('public', 'stock_warehouses',          'stock_warehouses exists');
SELECT has_table('public', 'stock_documents',           'stock_documents exists');
SELECT has_table('public', 'stock_document_items',      'stock_document_items exists');
SELECT has_table('public', 'stock_lots',                'stock_lots exists');
SELECT has_table('public', 'stock_lot_consumption',     'stock_lot_consumption exists');
SELECT has_table('public', 'stock_warehouse_permissions', 'stock_warehouse_permissions exists');

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Warehouse topology constraints
-- ────────────────────────────────────────────────────────────────────────────

-- Only one is_main=true warehouse can exist (partial unique index)
DO $$
BEGIN
  INSERT INTO stock_warehouses(name_uk, kind, is_main, sort_order)
    VALUES ('Main A','main',true,0);
  BEGIN
    INSERT INTO stock_warehouses(name_uk, kind, is_main, sort_order)
      VALUES ('Main B','main',true,1);
    RAISE EXCEPTION 'expected unique violation';
  EXCEPTION WHEN unique_violation THEN
    NULL; -- expected
  END;
  DELETE FROM stock_warehouses WHERE name_uk IN ('Main A','Main B');
END;
$$;
SELECT ok(true, 'only one is_main=true warehouse allowed');

-- kind CHECK constraint
DO $$
BEGIN
  BEGIN
    INSERT INTO stock_warehouses(name_uk, kind, is_main, sort_order)
      VALUES ('Bad','invalid_kind',false,0);
    RAISE EXCEPTION 'expected check violation';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;
SELECT ok(true, 'kind CHECK rejects invalid values');

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RPCs exist and are SECURITY DEFINER
-- ────────────────────────────────────────────────────────────────────────────
SELECT has_function('public', 'post_stock_document',     ARRAY['uuid','uuid'], 'post_stock_document exists');
SELECT has_function('public', 'unpost_writeoff_document', ARRAY['uuid','text','uuid'], 'unpost_writeoff_document exists');
SELECT has_function('public', '_drain_lots',             ARRAY['uuid','text'], '_drain_lots exists');
SELECT has_function('public', '_transfer_lots',          ARRAY['uuid'],       '_transfer_lots exists');
SELECT has_function('public', '_adjust_lots',            ARRAY['uuid'],       '_adjust_lots exists');
SELECT has_function('public', 'next_doc_number',         ARRAY['text'],       'next_doc_number exists');

-- ────────────────────────────────────────────────────────────────────────────
-- 4. stock_lots is write-protected via RLS (no direct INSERT for anon)
-- ────────────────────────────────────────────────────────────────────────────
SELECT throws_ok(
  $$
    SET LOCAL ROLE anon;
    INSERT INTO stock_lots(material_id, warehouse_id, source_document_id, unit_cost, qty_initial, qty_remaining)
    VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 0, 1, 1)
  $$,
  'new row violates row-level security policy',
  'stock_lots: anon direct insert blocked by RLS'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. doc_shape CHECK enforces field requirements
-- ────────────────────────────────────────────────────────────────────────────

-- incoming without warehouse_to_id should fail doc_shape check
DO $$
DECLARE
  v_wh uuid := gen_random_uuid();
BEGIN
  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (v_wh, 'Test Main', 'main', true, 0);

  BEGIN
    INSERT INTO stock_documents(
      doc_type, doc_number, status, doc_date,
      warehouse_from_id, warehouse_to_id, total_amount
    ) VALUES (
      'incoming','TEST-001','draft',CURRENT_DATE,
      NULL, NULL, 0
    );
    RAISE EXCEPTION 'expected check violation for missing warehouse_to_id on incoming';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  DELETE FROM stock_warehouses WHERE id = v_wh;
END;
$$;
SELECT ok(true, 'incoming without warehouse_to_id fails doc_shape CHECK');

-- ────────────────────────────────────────────────────────────────────────────
-- 6. next_doc_number generates sequential numbers
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  n1 text;
  n2 text;
BEGIN
  n1 := next_doc_number('incoming');
  n2 := next_doc_number('incoming');
  IF n1 = n2 THEN
    RAISE EXCEPTION 'next_doc_number returned duplicate: %', n1;
  END IF;
END;
$$;
SELECT ok(true, 'next_doc_number returns unique sequential values');

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Full post/unpost cycle
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_wh   uuid;
  v_mat  uuid;
  v_doc  uuid;
  v_sup  uuid;
  v_admin uuid;
  v_bal  numeric;
BEGIN
  -- Create prerequisite objects
  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (gen_random_uuid(), 'Cycle Test WH', 'other', false, 999)
    RETURNING id INTO v_wh;

  INSERT INTO materials(id, name_uk, unit, category)
    VALUES (gen_random_uuid(), 'Test Mat', 'шт', 'other')
    RETURNING id INTO v_mat;

  INSERT INTO material_inventory(material_id, warehouse_id, current_quantity)
    VALUES (v_mat, v_wh, 0)
    ON CONFLICT (material_id, warehouse_id) DO NOTHING;

  -- Get or create a superadmin
  SELECT id INTO v_admin FROM admin_users WHERE role = 'superadmin' LIMIT 1;
  IF v_admin IS NULL THEN
    v_admin := gen_random_uuid();
  END IF;

  -- Create incoming draft
  INSERT INTO stock_documents(
    id, doc_type, doc_number, status, doc_date,
    warehouse_to_id, total_amount
  ) VALUES (
    gen_random_uuid(), 'incoming',
    next_doc_number('incoming'),
    'draft', CURRENT_DATE, v_wh, 50
  ) RETURNING id INTO v_doc;

  INSERT INTO stock_document_items(
    stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total
  ) VALUES (v_doc, v_mat, 0, 5, 10, 50);

  -- Post it
  PERFORM post_stock_document(v_doc, v_admin);

  -- Check balance
  SELECT current_quantity INTO v_bal
    FROM material_inventory
   WHERE material_id = v_mat AND warehouse_id = v_wh;

  IF v_bal <> 5 THEN
    RAISE EXCEPTION 'expected balance=5 after incoming, got %', v_bal;
  END IF;

  -- Create writeoff draft
  DECLARE
    v_wo uuid;
  BEGIN
    INSERT INTO stock_documents(
      id, doc_type, doc_number, status, doc_date,
      warehouse_from_id, total_amount
    ) VALUES (
      gen_random_uuid(), 'writeoff',
      next_doc_number('writeoff'),
      'draft', CURRENT_DATE, v_wh, 20
    ) RETURNING id INTO v_wo;

    INSERT INTO stock_document_items(
      stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total
    ) VALUES (v_wo, v_mat, 0, 2, 10, 20);

    -- Post writeoff
    PERFORM post_stock_document(v_wo, v_admin);

    -- Check balance reduced
    SELECT current_quantity INTO v_bal
      FROM material_inventory
     WHERE material_id = v_mat AND warehouse_id = v_wh;

    IF v_bal <> 3 THEN
      RAISE EXCEPTION 'expected balance=3 after writeoff, got %', v_bal;
    END IF;

    -- Unpost writeoff
    PERFORM unpost_writeoff_document(v_wo, 'Test unpost reason', v_admin);

    -- Balance should restore
    SELECT current_quantity INTO v_bal
      FROM material_inventory
     WHERE material_id = v_mat AND warehouse_id = v_wh;

    IF v_bal <> 5 THEN
      RAISE EXCEPTION 'expected balance=5 after unpost, got %', v_bal;
    END IF;
  END;

  -- Cleanup
  DELETE FROM material_inventory WHERE material_id = v_mat;
  DELETE FROM materials WHERE id = v_mat;
  DELETE FROM stock_warehouses WHERE id = v_wh;
END;
$$;
SELECT ok(true, 'post incoming → post writeoff → unpost writeoff restores balance correctly');

-- ────────────────────────────────────────────────────────────────────────────
-- 8. ghost row created when allow_negative_balance=true and balance exhausted
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_wh   uuid;
  v_mat  uuid;
  v_doc  uuid;
  v_admin uuid;
  v_ghost_count int;
BEGIN
  -- Ensure allow_negative_balance = true
  INSERT INTO clinic_settings(key, value, updated_at, updated_by)
    VALUES ('allow_negative_balance', 'true', now(), NULL)
    ON CONFLICT(key) DO UPDATE SET value = 'true';

  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (gen_random_uuid(), 'Ghost Test WH', 'other', false, 998)
    RETURNING id INTO v_wh;

  INSERT INTO materials(id, name_uk, unit, category)
    VALUES (gen_random_uuid(), 'Ghost Mat', 'шт', 'other')
    RETURNING id INTO v_mat;

  INSERT INTO material_inventory(material_id, warehouse_id, current_quantity)
    VALUES (v_mat, v_wh, 0);

  SELECT id INTO v_admin FROM admin_users WHERE role = 'superadmin' LIMIT 1;
  IF v_admin IS NULL THEN v_admin := gen_random_uuid(); END IF;

  -- Writeoff 3 units with zero balance — should create ghost rows
  INSERT INTO stock_documents(
    id, doc_type, doc_number, status, doc_date,
    warehouse_from_id, total_amount
  ) VALUES (
    gen_random_uuid(), 'writeoff',
    next_doc_number('writeoff'),
    'draft', CURRENT_DATE, v_wh, 0
  ) RETURNING id INTO v_doc;

  INSERT INTO stock_document_items(
    stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total
  ) VALUES (v_doc, v_mat, 0, 3, 0, 0);

  PERFORM post_stock_document(v_doc, v_admin);

  SELECT COUNT(*) INTO v_ghost_count
    FROM stock_lot_consumption slc
    JOIN stock_document_items sdi ON sdi.id = slc.doc_item_id
   WHERE sdi.stock_document_id = v_doc AND slc.lot_id IS NULL;

  IF v_ghost_count = 0 THEN
    RAISE EXCEPTION 'expected ghost rows for negative balance writeoff';
  END IF;

  -- Cleanup
  DELETE FROM material_inventory WHERE material_id = v_mat;
  DELETE FROM materials WHERE id = v_mat;
  DELETE FROM stock_warehouses WHERE id = v_wh;
END;
$$;
SELECT ok(true, 'ghost lot_consumption rows created when allow_negative_balance=true');

-- ────────────────────────────────────────────────────────────────────────────
-- 9. transfer preserves cost basis
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_from uuid; v_to uuid; v_mat uuid;
  v_in_doc uuid; v_tf_doc uuid;
  v_admin uuid;
  v_cost numeric;
BEGIN
  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (gen_random_uuid(), 'Transfer From', 'other', false, 997)
    RETURNING id INTO v_from;
  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (gen_random_uuid(), 'Transfer To', 'other', false, 996)
    RETURNING id INTO v_to;

  INSERT INTO materials(id, name_uk, unit, category)
    VALUES (gen_random_uuid(), 'Transfer Mat', 'шт', 'other')
    RETURNING id INTO v_mat;

  INSERT INTO material_inventory(material_id, warehouse_id, current_quantity)
    VALUES (v_mat, v_from, 0), (v_mat, v_to, 0);

  SELECT id INTO v_admin FROM admin_users WHERE role = 'superadmin' LIMIT 1;
  IF v_admin IS NULL THEN v_admin := gen_random_uuid(); END IF;

  -- Receive 4 units @ 25 each
  INSERT INTO stock_documents(id, doc_type, doc_number, status, doc_date, warehouse_to_id, total_amount)
    VALUES (gen_random_uuid(), 'incoming', next_doc_number('incoming'), 'draft', CURRENT_DATE, v_from, 100)
    RETURNING id INTO v_in_doc;
  INSERT INTO stock_document_items(stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
    VALUES (v_in_doc, v_mat, 0, 4, 25, 100);
  PERFORM post_stock_document(v_in_doc, v_admin);

  -- Transfer 2 to destination
  INSERT INTO stock_documents(id, doc_type, doc_number, status, doc_date,
    warehouse_from_id, warehouse_to_id, total_amount)
    VALUES (gen_random_uuid(), 'transfer', next_doc_number('transfer'), 'draft', CURRENT_DATE,
      v_from, v_to, 50)
    RETURNING id INTO v_tf_doc;
  INSERT INTO stock_document_items(stock_document_id, material_id, pack_qty, unit_qty, unit_cost, line_total)
    VALUES (v_tf_doc, v_mat, 0, 2, 25, 50);
  PERFORM post_stock_document(v_tf_doc, v_admin);

  -- Destination lot should have unit_cost=25
  SELECT unit_cost INTO v_cost FROM stock_lots
   WHERE material_id = v_mat AND warehouse_id = v_to LIMIT 1;

  IF v_cost <> 25 THEN
    RAISE EXCEPTION 'expected cost=25 in destination lot, got %', v_cost;
  END IF;

  -- Cleanup
  DELETE FROM material_inventory WHERE material_id = v_mat;
  DELETE FROM materials WHERE id = v_mat;
  DELETE FROM stock_warehouses WHERE id IN (v_from, v_to);
END;
$$;
SELECT ok(true, 'transfer preserves cost basis in destination lot');

-- ────────────────────────────────────────────────────────────────────────────
-- 10. warehouse_permissions upsert works
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_wh   uuid;
  v_user uuid := gen_random_uuid();
  v_id   uuid;
BEGIN
  INSERT INTO stock_warehouses(id, name_uk, kind, is_main, sort_order)
    VALUES (gen_random_uuid(), 'Perm Test WH', 'other', false, 995)
    RETURNING id INTO v_wh;

  INSERT INTO stock_warehouse_permissions(user_id, warehouse_id, flags, updated_at, updated_by)
    VALUES (v_user, v_wh, '{"base_access":true}'::jsonb, now(), NULL)
    RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'permission insert returned null id';
  END IF;

  -- Upsert should update flags
  INSERT INTO stock_warehouse_permissions(user_id, warehouse_id, flags, updated_at, updated_by)
    VALUES (v_user, v_wh, '{"base_access":true,"view_incoming":true}'::jsonb, now(), NULL)
    ON CONFLICT(user_id, warehouse_id) DO UPDATE SET flags = EXCLUDED.flags;

  -- Cleanup
  DELETE FROM stock_warehouse_permissions WHERE user_id = v_user;
  DELETE FROM stock_warehouses WHERE id = v_wh;
END;
$$;
SELECT ok(true, 'warehouse_permissions upsert succeeds');

SELECT * FROM finish();
ROLLBACK;
