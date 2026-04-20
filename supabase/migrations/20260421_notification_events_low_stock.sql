-- Fix notification_events for low_stock_alert support and reminder idempotency.
--
-- Problems addressed:
--   1. appointment_id was NOT NULL, so inserting low_stock_alert events
--      (which have no appointment) always failed with a constraint violation.
--   2. low_stock_alert was not in the type CHECK, causing a second violation.
--   3. The reminders cron used a SELECT-then-INSERT pattern to deduplicate,
--      which is vulnerable to TOCTOU on concurrent runs. A partial unique index
--      on active (queued/processing) reminders per appointment turns this into
--      a DB-level guarantee.

BEGIN;

-- 1. Allow appointment_id to be NULL for system-level events.
ALTER TABLE public.notification_events
  ALTER COLUMN appointment_id DROP NOT NULL;

-- 2. Register low_stock_alert as a valid event type.
ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_type_check;

ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_type_check
  CHECK (type IN (
    'booking_confirmation',
    'appointment_reminder',
    'appointment_cancellation',
    'new_booking_admin',
    'low_stock_alert'
  ));

-- 3. Prevent duplicate active reminders per appointment.
--    Only one queued or in-flight reminder is allowed per appointment_id.
--    Sent/failed rows are excluded so a failed reminder can be rescheduled.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_reminder_per_appt
  ON public.notification_events (appointment_id)
  WHERE type = 'appointment_reminder'
    AND status IN ('queued', 'processing');

COMMIT;
