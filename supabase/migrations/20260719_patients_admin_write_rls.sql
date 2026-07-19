-- Admin write access to public.patients (UPDATE + DELETE).
--
-- Bug this fixes: the admin patient screen (PatientManagement) edits/deletes via
-- a client-side supabase.from('patients').update()/.delete(). But the only write
-- policies on `patients` were self-scoped:
--   • patients_own_update  — FOR UPDATE USING (auth.uid() = id)   (self only)
--   • (no DELETE policy at all)
-- Under RLS a non-matching row is silently filtered, so a staff edit/delete
-- touched 0 rows WITHOUT erroring — a false-success. The `can()` UI gate (Р1)
-- only hides the buttons for roles without the permission; it can't grant the
-- DB access those buttons need.
--
-- Scope choice — match the app permission matrix EXACTLY, not is_non_doctor_admin():
--   Patient writes go straight from the browser client to Supabase (no server
--   API in between), so RLS is the ONLY server-side gate. If RLS were broader
--   than can()/hasPermission (e.g. is_non_doctor_admin(), which also covers
--   assistant / billing_manager / inventory_manager / analyst), those read-only
--   roles could still update/delete patients by calling supabase.from('patients')
--   directly from devtools — the hidden UI button is not a security boundary.
--   So we mirror src/lib/permissions.ts precisely:
--     • patients:edit   → superadmin / admin / receptionist  (is_patient_editor)
--     • patients:delete → superadmin only                    (is_superadmin)
--   Doctors keep their patients_scoped_read SELECT scoping and get NO write.
--
-- Permissive policies OR-combine with the existing self-scoped ones, so patients
-- keep managing their own row and doctors keep their read scoping unchanged.

BEGIN;

-- Helper: patients:edit tier — superadmin / admin / receptionist.
-- SECURITY DEFINER (like is_admin_full_access / is_non_doctor_admin) so the
-- admin_users lookup bypasses RLS and cannot recurse.
CREATE OR REPLACE FUNCTION public.is_patient_editor()
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
      AND  au.role IN ('superadmin', 'admin', 'receptionist')
  );
$$;

COMMENT ON FUNCTION public.is_patient_editor() IS
  'True for the patients:edit tier (superadmin/admin/receptionist). Mirrors ROLE_PERMISSIONS in src/lib/permissions.ts.';

-- Helper: patients:delete tier — superadmin only.
CREATE OR REPLACE FUNCTION public.is_superadmin()
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
      AND  au.role = 'superadmin'
  );
$$;

COMMENT ON FUNCTION public.is_superadmin() IS
  'True only for the superadmin role. Mirrors the patients:delete gate in src/lib/permissions.ts.';

DROP POLICY IF EXISTS "patients_admin_update" ON public.patients;
CREATE POLICY "patients_admin_update" ON public.patients
  FOR UPDATE
  USING (public.is_patient_editor())
  WITH CHECK (public.is_patient_editor());

DROP POLICY IF EXISTS "patients_admin_delete" ON public.patients;
CREATE POLICY "patients_admin_delete" ON public.patients
  FOR DELETE
  USING (public.is_superadmin());

COMMENT ON POLICY "patients_admin_update" ON public.patients IS
  'superadmin/admin/receptionist may update any patient (== patients:edit). RLS is the authoritative gate for client-side writes.';
COMMENT ON POLICY "patients_admin_delete" ON public.patients IS
  'superadmin only may delete any patient (== patients:delete). RLS is the authoritative gate for client-side writes.';

COMMIT;
