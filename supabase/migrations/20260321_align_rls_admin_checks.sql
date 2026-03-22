-- Align RLS admin checks with public.admin_users (source of truth).
-- Replaces legacy JWT checks: (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean
-- and COALESCE(..., false) variants, with public.is_admin().

BEGIN;

-- Helper: true when the current auth user has a row in admin_users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if auth.uid() exists in public.admin_users; used by RLS instead of JWT is_admin claim.';

-- doctors
DROP POLICY IF EXISTS "doctors_admin_all" ON public.doctors;
CREATE POLICY "doctors_admin_all" ON public.doctors
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- services
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- working_hours
DROP POLICY IF EXISTS "working_hours_admin_all" ON public.working_hours;
CREATE POLICY "working_hours_admin_all" ON public.working_hours
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- reviews
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- contact_submissions
DROP POLICY IF EXISTS "contact_admin_all" ON public.contact_submissions;
CREATE POLICY "contact_admin_all" ON public.contact_submissions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_admin_all" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_all" ON public.newsletter_subscribers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- patients (admin read path)
DROP POLICY IF EXISTS "patients_own_read" ON public.patients;
CREATE POLICY "patients_own_read" ON public.patients
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- chat_sessions
DROP POLICY IF EXISTS "chat_sessions_read" ON public.chat_sessions;
CREATE POLICY "chat_sessions_read" ON public.chat_sessions
  FOR SELECT
  USING (patient_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "chat_sessions_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE
  USING (patient_id = auth.uid() OR public.is_admin())
  WITH CHECK (patient_id = auth.uid() OR public.is_admin());

-- chat_messages
DROP POLICY IF EXISTS "chat_messages_read" ON public.chat_messages;
CREATE POLICY "chat_messages_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (cs.patient_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND (
          (
            chat_messages.sender = 'patient'
            AND cs.patient_id = auth.uid()
          )
          OR (
            chat_messages.sender IN ('admin', 'system')
            AND public.is_admin()
          )
        )
    )
  );

COMMIT;
