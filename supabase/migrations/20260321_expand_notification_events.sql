-- Expand notification_events for full email workflow:
-- more event types, processing metadata, retry support.

BEGIN;

-- Widen the type CHECK to include new notification types.
ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_type_check;

ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_type_check
  CHECK (type IN (
    'booking_confirmation',
    'appointment_reminder',
    'appointment_cancellation',
    'new_booking_admin'
  ));

-- Add processing metadata columns (safe IF NOT EXISTS via DO block).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_events'
      AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE public.notification_events
      ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_events'
      AND column_name = 'resend_id'
  ) THEN
    ALTER TABLE public.notification_events
      ADD COLUMN resend_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_events'
      AND column_name = 'error'
  ) THEN
    ALTER TABLE public.notification_events
      ADD COLUMN error TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_events'
      AND column_name = 'attempts'
  ) THEN
    ALTER TABLE public.notification_events
      ADD COLUMN attempts INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Index for the cron processor: grab queued items quickly.
CREATE INDEX IF NOT EXISTS idx_notification_events_status_queued
  ON public.notification_events(status, created_at)
  WHERE status = 'queued';

-- Admin can read/update notification_events.
DROP POLICY IF EXISTS "notification_events_admin_all" ON public.notification_events;
CREATE POLICY "notification_events_admin_all" ON public.notification_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
