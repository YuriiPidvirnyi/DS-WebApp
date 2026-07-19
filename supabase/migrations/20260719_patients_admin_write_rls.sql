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
-- Scope choice — is_non_doctor_admin(), NOT is_admin():
--   is_admin() is true for ANY admin_users member, including doctors. But the
--   SELECT policy (patients_scoped_read) deliberately scopes doctors to only the
--   patients they treat, and lets `is_non_doctor_admin()` (role != 'doctor') see
--   all. We mirror that here so this migration does NOT un-scope doctors: only
--   non-doctor staff get blanket write. Fine-grained per-role control
--   (patients:edit → superadmin/admin/receptionist, patients:delete → superadmin)
--   stays in the app layer via can()/hasPermission — RLS is the coarse backstop.
--
-- Permissive policies OR-combine with the existing self-scoped ones, so patients
-- keep managing their own row and doctors keep their read scoping unchanged.

BEGIN;

DROP POLICY IF EXISTS "patients_admin_update" ON public.patients;
CREATE POLICY "patients_admin_update" ON public.patients
  FOR UPDATE
  USING (public.is_non_doctor_admin())
  WITH CHECK (public.is_non_doctor_admin());

DROP POLICY IF EXISTS "patients_admin_delete" ON public.patients;
CREATE POLICY "patients_admin_delete" ON public.patients
  FOR DELETE
  USING (public.is_non_doctor_admin());

COMMENT ON POLICY "patients_admin_update" ON public.patients IS
  'Non-doctor staff (admin_users.role != doctor) may update any patient; mirrors patients_scoped_read. Per-role gate is app-side via can().';
COMMENT ON POLICY "patients_admin_delete" ON public.patients IS
  'Non-doctor staff (admin_users.role != doctor) may delete any patient; per-role gate (patients:delete → superadmin) is app-side via can().';

COMMIT;
