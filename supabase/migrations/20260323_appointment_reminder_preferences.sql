BEGIN;

CREATE TABLE IF NOT EXISTS public.appointment_reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL UNIQUE,
  preference TEXT NOT NULL CHECK (preference IN ('email', 'sms', 'both', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_reminder_preferences_appointment_id
  ON public.appointment_reminder_preferences(appointment_id);

ALTER TABLE public.appointment_reminder_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointment_reminder_preferences_insert_public"
  ON public.appointment_reminder_preferences;
CREATE POLICY "appointment_reminder_preferences_insert_public"
  ON public.appointment_reminder_preferences
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "appointment_reminder_preferences_update_public"
  ON public.appointment_reminder_preferences;
CREATE POLICY "appointment_reminder_preferences_update_public"
  ON public.appointment_reminder_preferences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMIT;
