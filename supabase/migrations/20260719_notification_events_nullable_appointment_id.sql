-- notification_events.appointment_id: drop the NOT NULL constraint.
--
-- Why: recall (`recall_touch_1/2/3`) and `low_stock_alert` events are NOT tied to
-- an appointment — the producers (run_recall_job / run_low_stock_job) and the
-- original Vercel routes both insert these rows WITHOUT an appointment_id. With
-- appointment_id declared NOT NULL, every such insert raised 23502 on the first
-- real candidate (never surfaced earlier only because the queue drain itself was
-- broken, so no recall/low-stock row was ever produced). The edge function already
-- treats appointment_id as `string | null` and filters nulls before the appointment
-- batch-fetch (supabase/functions/process-notifications/index.ts), so nullable is
-- the intended contract.
--
-- Safe: no FK on appointment_id; the only unique index is partial on
-- `type = 'review_request'` (always appointment-linked); appointment-linked event
-- types continue to set appointment_id. Idempotent — DROP NOT NULL on an already
-- nullable column is a no-op.

ALTER TABLE public.notification_events
  ALTER COLUMN appointment_id DROP NOT NULL;
