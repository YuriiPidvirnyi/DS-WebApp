-- Stores lightweight product signals and async notification queue entries.
-- Safe to apply multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.form_feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  ref_id TEXT,
  comment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_feedback_events_created_at
  ON public.form_feedback_events(created_at DESC);

ALTER TABLE public.form_feedback_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "form_feedback_events_insert_public" ON public.form_feedback_events;
CREATE POLICY "form_feedback_events_insert_public" ON public.form_feedback_events
  FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation')),
  appointment_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_created_at
  ON public.notification_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_appointment_id
  ON public.notification_events(appointment_id);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_events_insert_public" ON public.notification_events;
CREATE POLICY "notification_events_insert_public" ON public.notification_events
  FOR INSERT
  WITH CHECK (true);

COMMIT;
