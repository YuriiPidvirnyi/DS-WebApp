-- Phase 5 pgTAP tests: calculation cards + treatment hook
BEGIN;

SELECT plan(8);

-- Helpers ------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stock_warehouses WHERE kind = 'main') THEN
    INSERT INTO stock_warehouses (name_uk, kind, is_main, sort_order)
    VALUES ('Test Main', 'main', true, 0);
  END IF;
END $$;

-- Insert a test service if the services table is available
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services WHERE id = '00000000-0000-0000-0001-000000000001'::uuid) THEN
    INSERT INTO services (id, name_uk, category, price_uah, is_active)
    VALUES ('00000000-0000-0000-0001-000000000001', 'Test Service Alpha', 'general', 500, true);
  END IF;
END $$;

-- Insert two test materials
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM materials WHERE id = '00000000-0000-0000-0002-000000000001'::uuid) THEN
    INSERT INTO materials (id, name_uk, unit, is_active)
    VALUES
      ('00000000-0000-0000-0002-000000000001', 'Mat Alpha', 'шт', true),
      ('00000000-0000-0000-0002-000000000002', 'Mat Beta',  'мл', true);
  END IF;
END $$;

-- Test 1: Create a calc card for a service
INSERT INTO service_calculation_cards (id, service_id, is_active)
VALUES ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', true)
ON CONFLICT (service_id) DO NOTHING;

SELECT is(
  (SELECT count(*)::int FROM service_calculation_cards
    WHERE service_id = '00000000-0000-0000-0001-000000000001'),
  1,
  'Test 1: calc card created for service'
);

-- Test 2: Add items to the card
INSERT INTO service_calculation_card_items (card_id, material_id, default_unit_qty, is_replaceable)
VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 2.5, true),
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000002', 1.0, false);

SELECT is(
  (SELECT count(*)::int FROM service_calculation_card_items
    WHERE card_id = '00000000-0000-0000-0003-000000000001'),
  2,
  'Test 2: two items inserted into the calc card'
);

-- Test 3: resolve_calculation_card_lines groups material quantities correctly
-- Insert a treatment record for the test service
DO $$
DECLARE
  v_admin_id UUID;
  v_patient_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM admin_users LIMIT 1;
  SELECT id INTO v_patient_id FROM patients LIMIT 1;

  IF v_admin_id IS NULL OR v_patient_id IS NULL THEN RETURN; END IF;

  INSERT INTO treatment_records (id, patient_id, doctor_id, status)
  VALUES ('00000000-0000-0000-0004-000000000001', v_patient_id, v_admin_id, 'draft')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO treatment_record_items (treatment_record_id, service_id, quantity, price_at_time)
  VALUES ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000001', 2, 500)
  ON CONFLICT DO NOTHING;
END $$;

-- For qty=2 services × 2.5 mat_alpha → 5.0; qty=2 × 1.0 mat_beta → 2.0
SELECT is(
  (SELECT unit_qty::numeric(10,4)
     FROM resolve_calculation_card_lines('00000000-0000-0000-0004-000000000001')
    WHERE material_id = '00000000-0000-0000-0002-000000000001'),
  5.0::numeric(10,4),
  'Test 3: resolve_calculation_card_lines multiplies qty × default_unit_qty'
);

-- Test 4: is_replaceable=false line is skipped by substitute
SELECT lives_ok(
  $$
    WITH before AS (
      SELECT material_id FROM service_calculation_card_items
       WHERE card_id = '00000000-0000-0000-0003-000000000001'
         AND is_replaceable = false
    )
    SELECT substitute_material_across_calc_cards(
      '00000000-0000-0000-0002-000000000002',  -- mat_beta (is_replaceable=false)
      '00000000-0000-0000-0002-000000000001'   -- mat_alpha
    )
  $$,
  'Test 4: substitute runs without error'
);

-- is_replaceable=false row must NOT be changed
SELECT is(
  (SELECT count(*)::int FROM service_calculation_card_items
    WHERE card_id = '00000000-0000-0000-0003-000000000001'
      AND material_id = '00000000-0000-0000-0002-000000000002'),
  1,
  'Test 4b: is_replaceable=false item is NOT substituted'
);

-- Test 5: substitute DOES replace is_replaceable=true lines
-- Add a second service with a replaceable reference to mat_beta
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services WHERE id = '00000000-0000-0000-0001-000000000002'::uuid) THEN
    INSERT INTO services (id, name_uk, category, price_uah, is_active)
    VALUES ('00000000-0000-0000-0001-000000000002', 'Test Service Beta', 'general', 600, true);
  END IF;
END $$;

INSERT INTO service_calculation_cards (id, service_id, is_active)
VALUES ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000002', true)
ON CONFLICT (service_id) DO NOTHING;

INSERT INTO service_calculation_card_items (card_id, material_id, default_unit_qty, is_replaceable)
VALUES ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', 3.0, true)
ON CONFLICT DO NOTHING;

-- Now substitute mat_beta → mat_alpha on replaceable lines
SELECT is(
  substitute_material_across_calc_cards(
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0002-000000000001'
  ),
  1,
  'Test 5: substitute returns count of updated rows'
);

-- Test 6: RLS blocks direct INSERT into service_calculation_cards from anon role
SELECT throws_ok(
  $$
    SET LOCAL role = anon;
    INSERT INTO service_calculation_cards (service_id, is_active)
    VALUES ('00000000-0000-0000-0001-000000000001', true);
  $$,
  'Test 6: anon role cannot insert into service_calculation_cards (RLS)'
);

-- Test 7: same-material substitute raises
SELECT throws_ok(
  $$
    SELECT substitute_material_across_calc_cards(
      '00000000-0000-0000-0002-000000000001',
      '00000000-0000-0000-0002-000000000001'
    )
  $$,
  'invalid_parameter_value',
  'same material',
  'Test 7: substitute with same material raises invalid_parameter_value'
);

SELECT * FROM finish();
ROLLBACK;
