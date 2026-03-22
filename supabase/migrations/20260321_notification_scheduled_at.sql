-- Add scheduled_at for deferred delivery (e.g. appointment reminders 24h before).
-- Events with scheduled_at in the future are skipped by the cron processor.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_events'
      AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.notification_events
      ADD COLUMN scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_events_scheduled
  ON public.notification_events(scheduled_at)
  WHERE status = 'queued';

COMMIT;
