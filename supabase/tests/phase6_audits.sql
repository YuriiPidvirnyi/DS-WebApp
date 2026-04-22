-- pgTAP tests for Phase 6: inventory audits
-- Run with: pg_prove supabase/tests/phase6_audits.sql
-- Requires: pgTAP extension, seeded Phase 1–5 tables

BEGIN;

SELECT plan(6);

-- ── Fixtures ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id   UUID := '00000000-0000-0000-0001-000000000010'::UUID;
  v_wh_id     UUID := '00000000-0000-0000-0002-000000000010'::UUID;
  v_mat_id    UUID := '00000000-0000-0000-0003-000000000010'::UUID;
  v_audit_id  UUID := '00000000-0000-0000-0004-000000000010'::UUID;
BEGIN
  -- admin user
  INSERT INTO public.admin_users (id, email, role, display_name, is_active)
  VALUES (v_user_id, 'audit_test@dentalstory.ua', 'inventory_manager', 'Audit Test', true)
  ON CONFLICT (id) DO NOTHING;

  -- warehouse
  INSERT INTO public.stock_warehouses (id, name_uk, kind, is_main, sort_order)
  VALUES (v_wh_id, 'Test WH Audit', 'main', false, 99)
  ON CONFLICT (id) DO NOTHING;

  -- material
  INSERT INTO public.materials (id, name_uk, unit, category, is_active)
  VALUES (v_mat_id, 'Test Mat Audit', 'шт', 'composite', true)
  ON CONFLICT (id) DO NOTHING;

  -- seed material_inventory
  INSERT INTO public.material_inventory (material_id, warehouse_id, current_quantity)
  VALUES (v_mat_id, v_wh_id, 42.0)
  ON CONFLICT (material_id, warehouse_id) DO UPDATE SET current_quantity = 42.0;

  -- audit row
  INSERT INTO public.inventory_audits
    (id, audit_number, status, responsible_user_id, warehouse_ids, audit_date)
  VALUES (v_audit_id, 'INV-99-0000001', 'draft', v_user_id, ARRAY[v_wh_id], CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ── Test 1: audit row created ─────────────────────────────────────────────────

SELECT ok(
  EXISTS(SELECT 1 FROM public.inventory_audits WHERE audit_number = 'INV-99-0000001'),
  'inventory_audits row created'
);

-- ── Test 2: initialise_audit_items inserts rows from material_inventory ───────

DO $$
DECLARE n INT;
BEGIN
  SELECT public.initialise_audit_items('00000000-0000-0000-0004-000000000010'::UUID) INTO n;
END $$;

SELECT ok(
  EXISTS(
    SELECT 1 FROM public.inventory_audit_items
     WHERE audit_id    = '00000000-0000-0000-0004-000000000010'
       AND material_id = '00000000-0000-0000-0003-000000000010'
       AND qty_before  = 42.0
  ),
  'initialise_audit_items seeds qty_before from material_inventory'
);

-- ── Test 3: initialise_audit_items is idempotent ──────────────────────────────

DO $$
DECLARE n INT;
BEGIN
  SELECT public.initialise_audit_items('00000000-0000-0000-0004-000000000010'::UUID) INTO n;
  -- second call should return 0 inserted due to ON CONFLICT DO NOTHING
  RAISE NOTICE 'Second init returned %', n;
END $$;

SELECT is(
  (SELECT COUNT(*)::INT FROM public.inventory_audit_items
    WHERE audit_id = '00000000-0000-0000-0004-000000000010'),
  1,
  'initialise_audit_items is idempotent — no duplicate rows'
);

-- ── Test 4: post generates adjustment document ────────────────────────────────

-- Set qty_actual so there is a delta
UPDATE public.inventory_audit_items
   SET qty_actual = 40.0
 WHERE audit_id   = '00000000-0000-0000-0004-000000000010'
   AND material_id = '00000000-0000-0000-0003-000000000010';

DO $$
BEGIN
  PERFORM public.post_inventory_audit('00000000-0000-0000-0004-000000000010'::UUID);
END $$;

SELECT ok(
  EXISTS(
    SELECT 1 FROM public.stock_documents
     WHERE doc_type            = 'adjustment'
       AND inventory_audit_id  = '00000000-0000-0000-0004-000000000010'
       AND status              = 'posted'
  ),
  'post_inventory_audit creates a posted adjustment document'
);

-- ── Test 5: audit status flips to posted ─────────────────────────────────────

SELECT is(
  (SELECT status FROM public.inventory_audits
    WHERE id = '00000000-0000-0000-0004-000000000010'),
  'posted',
  'inventory_audit status = posted after posting'
);

-- ── Test 6: re-posting an already-posted audit raises an error ────────────────

SELECT throws_ok(
  $$ SELECT public.post_inventory_audit('00000000-0000-0000-0004-000000000010'::UUID) $$,
  'P0001',
  NULL,
  'post_inventory_audit raises on already-posted audit'
);

-- ── Cleanup ───────────────────────────────────────────────────────────────────

SELECT * FROM finish();

ROLLBACK;
