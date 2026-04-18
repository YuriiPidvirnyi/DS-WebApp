-- CRITICAL FIX: Doctor-scoped RLS for appointments and patients.
--
-- Root cause in previous attempts (20260408_fix_doctor_scope_rls.sql,
-- 20260409_fix_rls_jwt_to_function.sql):
--   appointments.doctor_id  → FK to doctors.id
--   auth.uid()              → admin_users.id (≠ doctors.id)
--   → The subquery `appointments.doctor_id = auth.uid()` never matched.
--
-- Fix: introduce current_doctor_id() which bridges
--   auth.uid() → admin_users.doctor_id → doctors.id
-- so the join key is the same type on both sides.
--
-- Affected roles:
--   doctor       → scoped to own appointments / own patients only
--   all others   → unchanged (full admin_users read access retained)

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper: resolve doctors.id for the currently authenticated doctor admin
--    Returns NULL for every non-doctor admin_users row.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.doctor_id
  FROM   public.admin_users au
  WHERE  au.id   = auth.uid()
    AND  au.role = 'doctor'
  LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Helper: true when the caller is an admin actor who is NOT a doctor
--    (superadmin, admin, receptionist, assistant, billing_manager,
--     inventory_manager, analyst)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_non_doctor_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.admin_users au
    WHERE  au.id   = auth.uid()
      AND  au.role != 'doctor'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix appointments SELECT policy
--    Patients see their own; non-doctor admins see all;
--    doctors see only appointments where doctor_id = their doctors.id
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "appointments_own_read"    ON public.appointments;
DROP POLICY IF EXISTS "appointments_scoped_read" ON public.appointments;

CREATE POLICY "appointments_scoped_read" ON public.appointments
  FOR SELECT
  USING (
    -- patients see their own booking
    auth.uid() = patient_id
    OR
    -- superadmin / admin / receptionist / assistant / billing / inventory / analyst
    public.is_non_doctor_admin()
    OR
    -- doctors: only appointments assigned to them (correct key: doctors.id)
    (
      public.current_doctor_id() IS NOT NULL
      AND doctor_id = public.current_doctor_id()
    )
  );

-- Fix appointments UPDATE policy to the same scope
DROP POLICY IF EXISTS "appointments_own_update"    ON public.appointments;
DROP POLICY IF EXISTS "appointments_scoped_update" ON public.appointments;

CREATE POLICY "appointments_scoped_update" ON public.appointments
  FOR UPDATE
  USING (
    auth.uid() = patient_id
    OR public.is_non_doctor_admin()
    OR (
      public.current_doctor_id() IS NOT NULL
      AND doctor_id = public.current_doctor_id()
    )
  )
  WITH CHECK (
    auth.uid() = patient_id
    OR public.is_non_doctor_admin()
    OR (
      public.current_doctor_id() IS NOT NULL
      AND doctor_id = public.current_doctor_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fix patients SELECT policy
--    Patients see themselves; non-doctor admins see all;
--    doctors see only patients with whom they share at least one appointment
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "patients_own_read"    ON public.patients;
DROP POLICY IF EXISTS "patients_scoped_read" ON public.patients;

CREATE POLICY "patients_scoped_read" ON public.patients
  FOR SELECT
  USING (
    -- patients see their own row
    auth.uid() = id
    OR
    -- non-doctor admins see all
    public.is_non_doctor_admin()
    OR
    -- doctors: only patients they have treated / are treating
    (
      public.current_doctor_id() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM   public.appointments a
        WHERE  a.patient_id = patients.id
          AND  a.doctor_id  = public.current_doctor_id()
      )
    )
  );

COMMIT;
