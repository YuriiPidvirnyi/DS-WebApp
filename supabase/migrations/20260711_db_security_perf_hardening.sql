-- DB hardening for outstanding Supabase advisor warnings (security + performance).
--
-- Addresses, with zero behavioural change:
--   - function_search_path_mutable (security): 6 functions lacked a pinned
--     search_path. Verified live via the security advisor.
--   - duplicate_index (performance): public.stock_document_items had two pairs of
--     identical btree indexes. Verified live: idx_sdi_document_2 == idx_sdi_doc
--     (stock_document_id) and idx_sdi_material_2 == idx_sdi_mat (material_id).
--
-- Re-run the Supabase security + performance advisors after applying to confirm
-- these warnings clear.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Function search_path hardening
--    Pin search_path = public on the flagged functions. Done dynamically so we
--    cover every overload without hard-coding argument signatures, and so the
--    migration is a no-op for any function that does not exist on a given DB.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'deduct_inventory',
        'add_inventory',
        'admin_doctor_id',
        'admin_can_read_appointment',
        'set_payment_configs_updated_at',
        'next_req_number'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Drop duplicate indexes on stock_document_items
--    Keep the originals (idx_sdi_doc, idx_sdi_mat); drop the redundant copies.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_sdi_document_2;
DROP INDEX IF EXISTS public.idx_sdi_material_2;

COMMIT;
