-- CRITICAL FIX: Enforce doctor scope on patient data access
-- Doctors should only see their own patients (via appointments)
-- Admins can see all patients
-- Patients can see themselves

BEGIN;

-- Drop existing overly-permissive policy
DROP POLICY IF EXISTS "patients_own_read" ON public.patients;

-- Create new scoped policy
CREATE POLICY "patients_scoped_read" ON public.patients
  FOR SELECT USING (
    -- Patients can see themselves
    auth.uid() = id
    OR
    -- Admins (superadmin, admin, etc.) can see all
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    OR
    -- Doctors can see only their own patients (via appointments)
    -- The doctor's admin_users.id IS the auth.uid()
    (
      SELECT COUNT(*) > 0 FROM public.appointments
      WHERE appointments.patient_id = patients.id
      AND appointments.doctor_id = auth.uid()
    )
  );

-- Keep update/insert policies for patients themselves
-- (already restricted via auth.uid() = id)

COMMIT;
