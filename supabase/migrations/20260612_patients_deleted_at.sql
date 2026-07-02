-- Soft-delete tombstone for GDPR account deletion.
-- /api/cabinet/delete-account anonymizes the patient row and stamps deleted_at;
-- the column never existed, so the route failed with a column-not-found error.
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.patients.deleted_at IS
  'Set when the patient deleted their account; row is kept (anonymized) for treatment-record integrity.';
