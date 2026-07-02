-- pgTAP: Phase 3 materials v2 tests
-- Run: SELECT * FROM runtests();

BEGIN;
SELECT plan(6);

-- 1. materials.barcodes column exists and defaults to empty array
SELECT has_column('public', 'materials', 'barcodes', 'materials.barcodes column exists');
SELECT col_default_is('public', 'materials', 'barcodes', '{}', 'barcodes defaults to {}');

-- 2. GIN index on barcodes exists
SELECT has_index('public', 'materials', 'idx_materials_barcodes', 'GIN index on barcodes exists');

-- 3. pack_size_unit CHECK constraint
DO $$
BEGIN
  BEGIN
    INSERT INTO public.materials (name_uk, unit, pack_size_unit)
    VALUES ('test_invalid_unit', 'шт', 'invalid_unit');
    RAISE EXCEPTION 'expected CHECK violation';
  EXCEPTION WHEN check_violation THEN
    NULL; -- expected
  END;
END $$;
SELECT ok(true, 'pack_size_unit rejects invalid values');

-- 4. barcode array lookup via @> operator
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.materials (name_uk, unit, barcodes)
  VALUES ('BarcodeTestMat', 'шт', ARRAY['1234567890128'])
  RETURNING id INTO v_id;

  PERFORM 1 FROM public.materials
  WHERE barcodes @> ARRAY['1234567890128'] AND id = v_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'barcode GIN lookup failed';
  END IF;

  DELETE FROM public.materials WHERE id = v_id;
END $$;
SELECT ok(true, 'barcode array GIN lookup works');

-- 5. material_inventory.is_visible defaults to true
SELECT col_default_is('public', 'material_inventory', 'is_visible', 'true',
  'is_visible defaults to true');

-- 6. pack-to-unit numerics: pack_size_numerator * pack_qty = unit_qty (identity check)
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.materials (name_uk, unit, pack_size_numerator, pack_size_unit)
  VALUES ('PackUnitMat', 'мл', 5.0, 'мл')
  RETURNING id INTO v_id;

  PERFORM 1 FROM public.materials
  WHERE id = v_id AND pack_size_numerator * 3 = 15.0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pack math failed';
  END IF;

  DELETE FROM public.materials WHERE id = v_id;
END $$;
SELECT ok(true, 'pack_size_numerator arithmetic is correct');

SELECT * FROM finish();
ROLLBACK;
