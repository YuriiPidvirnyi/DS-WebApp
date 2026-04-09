-- Fix RLS policy drift: replace deprecated auth.jwt() claim with canonical
-- is_admin_actor() function for consistency with app-layer authorization.
--
-- Before: (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
-- After:  public.is_admin_actor()  -- checks admin_users table membership

BEGIN;

DROP POLICY IF EXISTS "patients_scoped_read" ON public.patients;

CREATE POLICY "patients_scoped_read" ON public.patients
  FOR SELECT USING (
    -- Patients can see themselves
    auth.uid() = id
    OR
    -- Admins: membership in admin_users table (canonical check)
    public.is_admin_actor()
    OR
    -- Doctors can see only their own patients (via appointments)
    (
      SELECT COUNT(*) > 0 FROM public.appointments
      WHERE appointments.patient_id = patients.id
      AND appointments.doctor_id = auth.uid()
    )
  );

COMMIT;
