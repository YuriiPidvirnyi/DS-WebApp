-- Supabase-native scheduling — part 1 of 2: observability table + producer jobs.
--
-- This migration is SAFE TO APPLY ANY TIME: it schedules nothing. It creates the
-- cron_runs observability table (the repo's 20260419_cron_runs.sql was never
-- applied — and its generated-column syntax was malformed) and the plpgsql
-- functions that replace the Vercel "producer" crons (reminders / recall /
-- low-stock / stock-metrics). The pg_cron schedules live in the part-2 migration
-- (20260718_cron_schedules.sql), applied at cutover.
--
-- Producers are faithful ports of:
--   app/api/cron/reminders/route.ts
--   app/api/cron/recall/route.ts
--   app/api/cron/low-stock-alerts/route.ts
--   app/api/cron/stock-metrics/route.ts   (RPC wrapper only)
-- All dates are pinned to UTC to match the JS routes (Vercel ran in UTC).

-- ── cron_runs (observability) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  duration_ms  integer     GENERATED ALWAYS AS (
                 ((EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000))::integer
               ) STORED,
  processed    integer     NOT NULL DEFAULT 0,
  error        text,
  status       text        NOT NULL DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS cron_runs_name_started_at_idx
  ON public.cron_runs (name, started_at DESC);

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

-- Admins can read; service role / SECURITY DEFINER jobs write (RLS bypassed).
DROP POLICY IF EXISTS "cron_runs_admin_read" ON public.cron_runs;
CREATE POLICY "cron_runs_admin_read"
  ON public.cron_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- ── Producer: reminders (daily 18:00 UTC) ────────────────────────────────────
-- Inserts appointment_reminder events for tomorrow's pending/confirmed appts
-- that have a non-empty guest_email, delivered 07:00 UTC next day, deduped
-- against ANY existing reminder for the appt (matches the route's dedup).
CREATE OR REPLACE FUNCTION public.run_reminders_job()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_run     uuid;
  v_cnt     integer := 0;
  v_tomorrow date := (now() AT TIME ZONE 'utc')::date + 1;
  v_deliver  timestamptz := ((now() AT TIME ZONE 'utc')::date + 1 + time '07:00') AT TIME ZONE 'utc';
BEGIN
  INSERT INTO public.cron_runs (name, status) VALUES ('reminders', 'running') RETURNING id INTO v_run;

  WITH ins AS (
    INSERT INTO public.notification_events
      (type, appointment_id, recipient_email, status, scheduled_at, details)
    SELECT 'appointment_reminder', a.id::text, a.guest_email, 'queued', v_deliver,
           jsonb_build_object('source', 'cron_reminder')
    FROM public.appointments a
    WHERE a.appointment_date::date = v_tomorrow
      AND a.status IN ('pending', 'confirmed')
      AND coalesce(btrim(a.guest_email), '') <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_events ne
        WHERE ne.type = 'appointment_reminder'
          AND ne.appointment_id = a.id::text
      )
    ON CONFLICT DO NOTHING   -- belt-and-suspenders for uniq_active_reminder_per_appt
    RETURNING 1
  )
  SELECT count(*) INTO v_cnt FROM ins;

  UPDATE public.cron_runs SET status = 'ok', finished_at = now(), processed = v_cnt WHERE id = v_run;
  RETURN v_cnt;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_runs SET status = 'error', finished_at = now(), error = sqlerrm WHERE id = v_run;
  RAISE;
END
$fn$;

-- ── Producer: recall 3-touch (daily 18:10 UTC) ───────────────────────────────
-- touch_1: candidates from get_recall_candidates(threshold=today-165d) with a
--          guest_email, not touched by any recall in the last 30 days.
-- touch_2: from touch_1 rows SENT exactly 14 days ago, not already touch_2'd in 30d.
-- touch_3: same at 28 days. All scheduled_at = now().
CREATE OR REPLACE FUNCTION public.run_recall_job()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_run       uuid;
  v_cnt       integer := 0;
  v_threshold date        := (now() AT TIME ZONE 'utc')::date - 165;
  v_cooldown  timestamptz := now() - interval '30 days';
  v_w2        date        := (now() AT TIME ZONE 'utc')::date - 14;
  v_w3        date        := (now() AT TIME ZONE 'utc')::date - 28;
BEGIN
  INSERT INTO public.cron_runs (name, status) VALUES ('recall', 'running') RETURNING id INTO v_run;

  WITH recent AS (
    -- any recall touch within cooldown (covers the route's recent + touch1 sets)
    SELECT DISTINCT details->>'recipient_email' AS email
    FROM public.notification_events
    WHERE type LIKE 'recall_touch_%' AND created_at >= v_cooldown
  ),
  t1 AS (
    INSERT INTO public.notification_events (type, recipient_email, status, scheduled_at, details)
    SELECT 'recall_touch_1', c.guest_email, 'queued', now(),
           jsonb_build_object(
             'recipient_email', c.guest_email,
             'patient_name', coalesce(c.patient_name, 'Шановний пацієнт'),
             'touch', 1,
             'last_visit_date', c.last_visit_date)
    FROM public.get_recall_candidates(v_threshold) c
    WHERE c.guest_email IS NOT NULL
      AND c.guest_email NOT IN (SELECT email FROM recent WHERE email IS NOT NULL)
    RETURNING 1
  ),
  ex2 AS (
    SELECT DISTINCT details->>'recipient_email' AS e FROM public.notification_events
    WHERE type = 'recall_touch_2' AND created_at >= v_cooldown
  ),
  t2 AS (
    INSERT INTO public.notification_events (type, recipient_email, status, scheduled_at, details)
    SELECT DISTINCT ON (n.details->>'recipient_email')
           'recall_touch_2', n.details->>'recipient_email', 'queued', now(),
           jsonb_build_object(
             'recipient_email', n.details->>'recipient_email',
             'patient_name', coalesce(n.details->>'patient_name', 'Шановний пацієнт'),
             'touch', 2)
    FROM public.notification_events n
    WHERE n.type = 'recall_touch_1' AND n.status = 'sent'
      AND (n.processed_at AT TIME ZONE 'utc')::date = v_w2
      AND n.details->>'recipient_email' NOT IN (SELECT e FROM ex2 WHERE e IS NOT NULL)
    RETURNING 1
  ),
  ex3 AS (
    SELECT DISTINCT details->>'recipient_email' AS e FROM public.notification_events
    WHERE type = 'recall_touch_3' AND created_at >= v_cooldown
  ),
  t3 AS (
    INSERT INTO public.notification_events (type, recipient_email, status, scheduled_at, details)
    SELECT DISTINCT ON (n.details->>'recipient_email')
           'recall_touch_3', n.details->>'recipient_email', 'queued', now(),
           jsonb_build_object(
             'recipient_email', n.details->>'recipient_email',
             'patient_name', coalesce(n.details->>'patient_name', 'Шановний пацієнт'),
             'touch', 3)
    FROM public.notification_events n
    WHERE n.type = 'recall_touch_1' AND n.status = 'sent'
      AND (n.processed_at AT TIME ZONE 'utc')::date = v_w3
      AND n.details->>'recipient_email' NOT IN (SELECT e FROM ex3 WHERE e IS NOT NULL)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM t1) + (SELECT count(*) FROM t2) + (SELECT count(*) FROM t3)
  INTO v_cnt;

  UPDATE public.cron_runs SET status = 'ok', finished_at = now(), processed = v_cnt WHERE id = v_run;
  RETURN v_cnt;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_runs SET status = 'error', finished_at = now(), error = sqlerrm WHERE id = v_run;
  RAISE;
END
$fn$;

-- ── Producer: low-stock alerts (weekdays 08:00 UTC) ──────────────────────────
-- Active materials whose summed inventory < min_stock_level → one admin alert,
-- deduped against a queued alert already created today (UTC). Admin recipient
-- comes from Vault (a DB job cannot read process.env).
CREATE OR REPLACE FUNCTION public.run_low_stock_job()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_run   uuid;
  v_cnt   integer;
  v_low   jsonb;
  v_text  text;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_admin text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'admin_notification_email');
BEGIN
  INSERT INTO public.cron_runs (name, status) VALUES ('low-stock-alerts', 'running') RETURNING id INTO v_run;

  WITH sums AS (
    SELECT m.id,
           m.name_uk,
           m.min_stock_level::numeric AS min_level,
           coalesce(sum(mi.current_quantity), 0)::numeric AS total
    FROM public.materials m
    LEFT JOIN public.material_inventory mi ON mi.material_id = m.id
    WHERE m.is_active = true
    GROUP BY m.id, m.name_uk, m.min_stock_level
  ),
  low AS (
    SELECT id, name_uk AS name, trim_scale(total) AS current, trim_scale(min_level) AS min
    FROM sums WHERE total < min_level
  )
  SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'current', current, 'min', min)),
         count(*)
  INTO v_low, v_cnt
  FROM low;

  -- Nothing low, OR an alert was already queued today → no-op
  IF coalesce(v_cnt, 0) = 0
     OR EXISTS (
       SELECT 1 FROM public.notification_events
       WHERE type = 'low_stock_alert' AND status = 'queued'
         AND created_at >= (v_today::timestamp AT TIME ZONE 'utc')
     )
  THEN
    UPDATE public.cron_runs SET status = 'ok', finished_at = now(), processed = 0 WHERE id = v_run;
    RETURN 0;
  END IF;

  -- Low stock detected but no recipient configured → surface as an error, don't silently succeed
  IF coalesce(v_admin, '') = '' THEN
    UPDATE public.cron_runs SET status = 'error', finished_at = now(), processed = 0,
      error = 'admin_notification_email vault secret not set' WHERE id = v_run;
    RAISE WARNING '[run_low_stock_job] admin_notification_email vault secret not set';
    RETURN 0;
  END IF;

  SELECT string_agg(format('%s: %s / %s', e->>'name', e->>'current', e->>'min'), E'\n')
  INTO v_text
  FROM jsonb_array_elements(v_low) e;

  INSERT INTO public.notification_events (type, recipient_email, status, scheduled_at, details)
  VALUES ('low_stock_alert', v_admin, 'queued', now(),
    jsonb_build_object(
      'subject', format('Низький залишок: %s матеріал(ів)', v_cnt),
      'materials', v_low,
      'text', format('Увага! Наступні матеріали мають залишок нижче мінімального:%s%s', E'\n\n', v_text)));

  UPDATE public.cron_runs SET status = 'ok', finished_at = now(), processed = v_cnt WHERE id = v_run;
  RETURN v_cnt;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_runs SET status = 'error', finished_at = now(), error = sqlerrm WHERE id = v_run;
  RAISE;
END
$fn$;

-- ── Producer: stock-metrics snapshot (daily 21:55 UTC) ───────────────────────
-- Thin wrapper over the existing RPC for yesterday + today, with cron_runs logging.
CREATE OR REPLACE FUNCTION public.run_stock_metrics_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_run uuid;
BEGIN
  INSERT INTO public.cron_runs (name, status) VALUES ('stock-metrics', 'running') RETURNING id INTO v_run;
  PERFORM public.snapshot_stock_metrics_daily((now() AT TIME ZONE 'utc')::date - 1);
  PERFORM public.snapshot_stock_metrics_daily((now() AT TIME ZONE 'utc')::date);
  UPDATE public.cron_runs SET status = 'ok', finished_at = now(), processed = 2 WHERE id = v_run;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_runs SET status = 'error', finished_at = now(), error = sqlerrm WHERE id = v_run;
  RAISE;
END
$fn$;

-- Producers run as the definer (postgres) inside pg_cron; keep them off the API surface.
REVOKE ALL ON FUNCTION public.run_reminders_job()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_recall_job()         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_low_stock_job()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_stock_metrics_job()  FROM PUBLIC, anon, authenticated;
