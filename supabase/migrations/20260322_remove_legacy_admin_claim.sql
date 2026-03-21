-- Remove dependency on auth.users.user_metadata.is_admin.
-- Admin access source of truth: public.admin_users only.

CREATE OR REPLACE FUNCTION public.is_admin_actor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.id = auth.uid()
    );
$$;

-- doctors
DROP POLICY IF EXISTS "doctors_admin_all" ON public.doctors;
CREATE POLICY "doctors_admin_all" ON public.doctors
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- services
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- working_hours
DROP POLICY IF EXISTS "working_hours_admin_all" ON public.working_hours;
CREATE POLICY "working_hours_admin_all" ON public.working_hours
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- patients
DROP POLICY IF EXISTS "patients_own_read" ON public.patients;
CREATE POLICY "patients_own_read" ON public.patients
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin_actor());

-- appointments
DROP POLICY IF EXISTS "appointments_own_read" ON public.appointments;
CREATE POLICY "appointments_own_read" ON public.appointments
  FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin_actor());

DROP POLICY IF EXISTS "appointments_own_update" ON public.appointments;
CREATE POLICY "appointments_own_update" ON public.appointments
  FOR UPDATE
  USING (auth.uid() = patient_id OR public.is_admin_actor())
  WITH CHECK (auth.uid() = patient_id OR public.is_admin_actor());

-- reviews
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- contact_submissions
DROP POLICY IF EXISTS "contact_admin_all" ON public.contact_submissions;
CREATE POLICY "contact_admin_all" ON public.contact_submissions
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_admin_all" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_all" ON public.newsletter_subscribers
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- chat_sessions (replace permissive/open or legacy policies)
DROP POLICY IF EXISTS "chat_sessions_read" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_select_scope" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_scope" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_scope" ON public.chat_sessions;
DROP POLICY IF EXISTS "Patients can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Patients can create sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON public.chat_sessions;

CREATE POLICY "chat_sessions_read" ON public.chat_sessions
  FOR SELECT
  USING (patient_id = auth.uid() OR public.is_admin_actor());

CREATE POLICY "chat_sessions_insert" ON public.chat_sessions
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "chat_sessions_update" ON public.chat_sessions
  FOR UPDATE
  USING (patient_id = auth.uid() OR public.is_admin_actor())
  WITH CHECK (patient_id = auth.uid() OR public.is_admin_actor());

-- chat_messages (replace permissive/open or legacy policies)
DROP POLICY IF EXISTS "chat_messages_read" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_scope" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_scope" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_scope" ON public.chat_messages;
DROP POLICY IF EXISTS "Patients can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Patients can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.chat_messages;

CREATE POLICY "chat_messages_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions s
      WHERE s.id = session_id
        AND (s.patient_id = auth.uid() OR public.is_admin_actor())
    )
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions s
      WHERE s.id = session_id
        AND (
          (s.patient_id = auth.uid() AND sender = 'patient')
          OR (public.is_admin_actor() AND sender = 'admin')
        )
    )
  );

CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE
  USING (
    sender = 'admin'
    AND public.is_admin_actor()
    AND EXISTS (
      SELECT 1
      FROM public.chat_sessions s
      WHERE s.id = session_id
    )
  )
  WITH CHECK (
    sender = 'admin'
    AND public.is_admin_actor()
    AND EXISTS (
      SELECT 1
      FROM public.chat_sessions s
      WHERE s.id = session_id
    )
  );
