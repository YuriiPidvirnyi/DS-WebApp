-- Phase 0: clinic_settings key/value store.
--
-- All inventory-v2 runtime toggles live here.  Every consumer MUST read via
--   SELECT value FROM clinic_settings WHERE key = '<k>'
-- and handle a missing row gracefully (returns NULL → fall back to code default).
--
-- Writes go through PATCH /api/stock/clinic-settings (superadmin/admin only).
-- Direct UPDATE is blocked by RLS for all non-service-role sessions.
--
-- Keys seeded below correspond to Q2–Q6 locked decisions in ADR-014 §13.1.

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID        REFERENCES public.admin_users(id) ON DELETE SET NULL
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read all settings.
CREATE POLICY "clinic_settings_admin_read"
  ON public.clinic_settings FOR SELECT
  USING (public.is_admin());

-- Only superadmin / admin may write settings.  The API layer further restricts
-- this to those two roles via canAccessFeature('settings:edit').
CREATE POLICY "clinic_settings_superadmin_write"
  ON public.clinic_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Seed initial values.  ON CONFLICT DO NOTHING so re-running is safe.
INSERT INTO public.clinic_settings (key, value) VALUES
  -- Q5 lock: allow negative stock for first 30–60 days of ramp-up.
  -- Flip to false via PATCH /api/stock/clinic-settings after Phase-6 audit.
  ('allow_negative_balance',       'true'::jsonb),
  -- Q2 lock: auto-seed a draft writeoff on treatment save, fully editable.
  ('writeoff_mode',                '"draft_hybrid"'::jsonb),
  -- Q3 lock: A/P bill creation deferred until Cash module ships.
  ('auto_ap_bill_on_incoming',     'false'::jsonb),
  -- Q3 companion: no default expense category until Cash module.
  ('default_expense_category_id',  'null'::jsonb),
  -- Q6 lock: per-warehouse permission matrix enforced from Phase 1.
  ('enforce_stock_permissions',    'true'::jsonb),
  -- UI toggle: show "Моя інвентаризація" menu item clinic-wide (tooltip 418).
  ('show_my_inventory',            'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
