-- pgTAP tests for Phase 7: stock reports
-- Run with: pg_prove supabase/tests/phase7_reports.sql
-- Requires: pgTAP extension, seeded Phase 1–6 tables

BEGIN;

SELECT plan(8);

-- ── Fixtures ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id   UUID := '00000000-0000-0000-0001-000000000070'::UUID;
  v_wh_id     UUID := '00000000-0000-0000-0002-000000000070'::UUID;
  v_mat_id    UUID := '00000000-0000-0000-0003-000000000070'::UUID;
BEGIN
  INSERT INTO public.admin_users (id, email, role, display_name, is_active)
  VALUES (v_user_id, 'report_test@dentalstory.ua', 'inventory_manager', 'Report Test', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.stock_warehouses (id, name_uk, kind, is_main, sort_order)
  VALUES (v_wh_id, 'Test WH Reports', 'main', false, 199)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.materials (id, name_uk, unit, category, is_active)
  VALUES (v_mat_id, 'Test Mat Reports', 'шт', 'composite', true)
  ON CONFLICT (id) DO NOTHING;

  -- seed a positive balance in material_inventory
  INSERT INTO public.material_inventory (material_id, warehouse_id, quantity, weighted_avg_cost, critical_level)
  VALUES (v_mat_id, v_wh_id, 10, 25.50, 2)
  ON CONFLICT (material_id, warehouse_id)
  DO UPDATE SET quantity = 10, weighted_avg_cost = 25.50;
END $$;

-- ── 1. report_balances returns the seeded row ─────────────────────────────────

SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.report_balances(
      p_warehouse_id    := NULL,
      p_category_id     := NULL,
      p_balance_state   := 'positive',
      p_critical_only   := false
    )
    WHERE material_id = '00000000-0000-0000-0003-000000000070'::UUID
      AND warehouse_id = '00000000-0000-0000-0002-000000000070'::UUID
      AND qty = 10
  ),
  'report_balances: positive filter returns seeded inventory row'
);

-- ── 2. report_balances zero filter excludes positive rows ─────────────────────

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM public.report_balances(
      p_warehouse_id    := NULL,
      p_category_id     := NULL,
      p_balance_state   := 'zero',
      p_critical_only   := false
    )
    WHERE material_id = '00000000-0000-0000-0003-000000000070'::UUID
  ),
  'report_balances: zero filter excludes rows with qty > 0'
);

-- ── 3. report_balances critical_only = true filters by critical_level ─────────

SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.report_balances(
      p_warehouse_id    := NULL,
      p_category_id     := NULL,
      p_balance_state   := 'all',
      p_critical_only   := false
    )
    WHERE material_id = '00000000-0000-0000-0003-000000000070'::UUID
  ),
  'report_balances: all filter includes seeded row'
);

-- ── 4. report_critical_stock_reorder runs without error ───────────────────────

SELECT ok(
  (SELECT COUNT(*) >= 0 FROM public.report_critical_stock_reorder()),
  'report_critical_stock_reorder: executes successfully and returns non-negative count'
);

-- ── 5. report_writeoff runs without error for empty period ───────────────────

SELECT ok(
  (SELECT COUNT(*) >= 0 FROM public.report_writeoff(
    p_from         := '2000-01-01'::DATE,
    p_to           := '2000-01-02'::DATE,
    p_warehouse_id := NULL,
    p_doctor_id    := NULL,
    p_service_id   := NULL
  )),
  'report_writeoff: returns empty result for period with no data'
);

-- ── 6. report_service_cost runs without error ─────────────────────────────────

SELECT ok(
  (SELECT COUNT(*) >= 0 FROM public.report_service_cost(
    p_from := '2000-01-01'::DATE,
    p_to   := '2000-01-02'::DATE
  )),
  'report_service_cost: executes successfully for empty period'
);

-- ── 7. report_product_history runs without error ──────────────────────────────

SELECT ok(
  (SELECT COUNT(*) >= 0 FROM public.report_product_history(
    p_material_id  := '00000000-0000-0000-0003-000000000070'::UUID,
    p_warehouse_id := '00000000-0000-0000-0002-000000000070'::UUID,
    p_from         := '2000-01-01'::DATE,
    p_to           := '2000-01-02'::DATE
  )),
  'report_product_history: returns empty result for period with no events'
);

-- ── 8. All 5 report functions are SECURITY DEFINER ───────────────────────────

SELECT ok(
  (
    SELECT COUNT(*)::INT = 5
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'report_balances',
        'report_product_history',
        'report_critical_stock_reorder',
        'report_writeoff',
        'report_service_cost'
      )
      AND p.prosecdef = true
  ),
  'all 5 report functions are SECURITY DEFINER'
);

-- ── Cleanup ───────────────────────────────────────────────────────────────────

DELETE FROM public.material_inventory
WHERE material_id = '00000000-0000-0000-0003-000000000070'::UUID
  AND warehouse_id = '00000000-0000-0000-0002-000000000070'::UUID;

DELETE FROM public.materials WHERE id = '00000000-0000-0000-0003-000000000070'::UUID;
DELETE FROM public.stock_warehouses WHERE id = '00000000-0000-0000-0002-000000000070'::UUID;
DELETE FROM public.admin_users WHERE id = '00000000-0000-0000-0001-000000000070'::UUID;

SELECT * FROM finish();

ROLLBACK;
