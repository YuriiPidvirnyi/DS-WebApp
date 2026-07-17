-- Post-visit Google review request emails.
--
-- Problems addressed:
--   1. New event type 'review_request': queued when an appointment transitions
--      to 'completed', delivered ~2h later by /api/cron/notifications.
--   2. The recall cron (/api/cron/recall) has been inserting recall_touch_1/2/3
--      events that no migration ever registered in the type CHECK — on a fresh
--      environment those inserts fail. Register them here.
--   3. One review ask per appointment, ever: a partial unique index makes the
--      completion hook idempotent at the DB level (re-completing after no_show
--      → pending → … can fire the hook twice).

BEGIN;

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_type_check;

ALTER TABLE public.notification_events
  ADD CONSTRAINT notification_events_type_check
  CHECK (type IN (
    'booking_confirmation',
    'appointment_reminder',
    'appointment_cancellation',
    'new_booking_admin',
    'low_stock_alert',
    'recall_touch_1',
    'recall_touch_2',
    'recall_touch_3',
    'review_request'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_review_request_per_appt
  ON public.notification_events (appointment_id)
  WHERE type = 'review_request';

COMMIT;
