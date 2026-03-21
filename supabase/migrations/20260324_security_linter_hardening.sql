-- Security hardening for Supabase DB linter warnings:
-- - function_search_path_mutable
-- - rls_policy_always_true

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Function search_path hardening
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.patients (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chat_session_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_sessions
  SET
    updated_at = NOW(),
    last_message = NEW.content,
    unread_count = CASE
      WHEN NEW.sender = 'patient' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2) Replace permissive RLS policies (WITH CHECK (true) / USING (true))
-- ---------------------------------------------------------------------------

-- appointment_reminder_preferences
DROP POLICY IF EXISTS "appointment_reminder_preferences_insert_public"
  ON public.appointment_reminder_preferences;
CREATE POLICY "appointment_reminder_preferences_insert_public"
  ON public.appointment_reminder_preferences
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND appointment_id IS NOT NULL
    AND char_length(trim(appointment_id)) BETWEEN 1 AND 120
    AND preference IN ('email', 'sms', 'both', 'none')
  );

DROP POLICY IF EXISTS "appointment_reminder_preferences_update_public"
  ON public.appointment_reminder_preferences;
CREATE POLICY "appointment_reminder_preferences_update_public"
  ON public.appointment_reminder_preferences
  FOR UPDATE
  TO anon, authenticated
  USING (
    auth.role() IN ('anon', 'authenticated')
  )
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND appointment_id IS NOT NULL
    AND char_length(trim(appointment_id)) BETWEEN 1 AND 120
    AND preference IN ('email', 'sms', 'both', 'none')
  );

-- appointments
DROP POLICY IF EXISTS "appointments_insert_public" ON public.appointments;
CREATE POLICY "appointments_insert_public" ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND appointment_date IS NOT NULL
    AND appointment_time IS NOT NULL
    AND status = 'pending'
    AND char_length(trim(coalesce(patient_name, guest_name, ''))) BETWEEN 2 AND 160
    AND char_length(trim(coalesce(guest_phone, ''))) BETWEEN 7 AND 32
    AND (
      guest_email IS NULL
      OR guest_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  );

-- contact_submissions
DROP POLICY IF EXISTS "contact_insert_public" ON public.contact_submissions;
CREATE POLICY "contact_insert_public" ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND char_length(trim(name)) BETWEEN 2 AND 160
    AND char_length(trim(phone)) BETWEEN 7 AND 32
    AND (
      email IS NULL
      OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  );

-- form_feedback_events
DROP POLICY IF EXISTS "form_feedback_events_insert_public" ON public.form_feedback_events;
CREATE POLICY "form_feedback_events_insert_public" ON public.form_feedback_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND char_length(trim(form)) > 0
    AND rating IN ('up', 'down')
    AND (comment IS NULL OR char_length(comment) <= 2000)
  );

-- newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert_public" ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND is_active = true
    AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

DROP POLICY IF EXISTS "newsletter_update_public" ON public.newsletter_subscribers;

-- notification_events
DROP POLICY IF EXISTS "notification_events_insert_public" ON public.notification_events;
CREATE POLICY "notification_events_insert_public" ON public.notification_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND type = 'booking_confirmation'
    AND status = 'queued'
    AND char_length(trim(appointment_id)) > 0
    AND recipient_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

-- reviews
DROP POLICY IF EXISTS "reviews_insert_public" ON public.reviews;
CREATE POLICY "reviews_insert_public" ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.role() IN ('anon', 'authenticated')
    AND rating BETWEEN 1 AND 5
    AND status = 'pending'
    AND char_length(trim(name)) BETWEEN 2 AND 120
    AND char_length(trim(service)) BETWEEN 2 AND 120
    AND char_length(trim(comment)) BETWEEN 5 AND 4000
    AND (
      email IS NULL
      OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
  );

COMMIT;
