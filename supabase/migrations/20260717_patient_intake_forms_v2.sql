-- Full clinic questionnaires (adult / child) on top of the basic intake form.
--
-- The paper анкети (adult "Медична та стоматологічна історія" and the
-- children's form) are digitized: structured answers live in a JSONB column
-- keyed by the field ids defined in src/content/intake-form-definitions.ts.
-- 'basic' keeps the short promo-QR form shipped earlier in this PR.

BEGIN;

ALTER TABLE public.patient_intake_forms
  ADD COLUMN form_type TEXT NOT NULL DEFAULT 'basic'
    CHECK (form_type IN ('basic', 'adult', 'child')),
  ADD COLUMN answers JSONB,
  ADD COLUMN submitted_via TEXT NOT NULL DEFAULT 'public'
    CHECK (submitted_via IN ('public', 'cabinet'));

COMMIT;
