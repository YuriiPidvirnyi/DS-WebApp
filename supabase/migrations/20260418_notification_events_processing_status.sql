-- Adds 'processing' status to notification_events so the cron worker can claim
-- rows atomically before sending, preventing double-sends on concurrent runs.
-- Also adds claimed_at for stuck-row detection (recycle after 10 min).

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_status_check;

ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_status_check
    CHECK (status IN ('queued', 'processing', 'sent', 'failed'));

ALTER TABLE public.notification_events
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notification_events_claimed_at
  ON public.notification_events(claimed_at)
  WHERE status = 'processing';
