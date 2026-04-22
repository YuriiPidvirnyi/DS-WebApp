-- pgTAP tests for Phase 0: clinic_settings table.
--
-- Run against a Supabase DB that has had 20260430_clinic_settings.sql applied:
--   psql $DATABASE_URL -f supabase/tests/stock_phase0.test.sql
--
-- Requires pgTAP extension:
--   CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(11);

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Schema
-- ─────────────────────────────────────────────────────────────────────────

SELECT has_table('public', 'clinic_settings', 'clinic_settings table exists');

SELECT has_column('public', 'clinic_settings', 'key',        'has column: key');
SELECT has_column('public', 'clinic_settings', 'value',      'has column: value');
SELECT has_column('public', 'clinic_settings', 'updated_at', 'has column: updated_at');
SELECT has_column('public', 'clinic_settings', 'updated_by', 'has column: updated_by');

SELECT col_is_pk('public', 'clinic_settings', 'key', 'key is primary key');

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Initial values (all 6 Q-lock rows present)
-- ─────────────────────────────────────────────────────────────────────────

SELECT is(
  (SELECT value FROM public.clinic_settings WHERE key = 'allow_negative_balance'),
  'true'::jsonb,
  'Q5: allow_negative_balance defaults to true'
);

SELECT is(
  (SELECT value FROM public.clinic_settings WHERE key = 'writeoff_mode'),
  '"draft_hybrid"'::jsonb,
  'Q2: writeoff_mode defaults to draft_hybrid'
);

SELECT is(
  (SELECT value FROM public.clinic_settings WHERE key = 'auto_ap_bill_on_incoming'),
  'false'::jsonb,
  'Q3: auto_ap_bill_on_incoming defaults to false'
);

SELECT is(
  (SELECT value FROM public.clinic_settings WHERE key = 'enforce_stock_permissions'),
  'true'::jsonb,
  'Q6: enforce_stock_permissions defaults to true'
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS enabled
-- ─────────────────────────────────────────────────────────────────────────

SELECT policies_are(
  'public',
  'clinic_settings',
  ARRAY['clinic_settings_admin_read', 'clinic_settings_superadmin_write'],
  'expected RLS policies exist on clinic_settings'
);

SELECT * FROM finish();

ROLLBACK;
