-- Expand admin_users roles to include receptionist and senior_assistant.
-- Also adds doctor_id FK (links admin login to a doctor record), phone, and specialization.

BEGIN;

-- 1. Expand the role constraint
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (
    'superadmin',
    'admin',
    'receptionist',
    'doctor',
    'senior_assistant',
    'assistant',
    'staff'          -- kept for backwards compat; treat as assistant in app
  ));

-- 2. Link doctor logins to their doctor profile record
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_users_doctor_id
  ON public.admin_users (doctor_id);

-- 3. Partial unique index: at most one admin_users row per doctor_id
--    (NULLs are excluded from unique indexes so non-doctor rows are unaffected)
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_users_doctor_id
  ON public.admin_users (doctor_id)
  WHERE doctor_id IS NOT NULL;

COMMIT;
