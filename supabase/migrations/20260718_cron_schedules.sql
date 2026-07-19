-- Supabase-native scheduling — part 2 of 2: the pg_cron schedules (THE SWITCH).
--
-- Apply this LAST, at cutover, AFTER:
--   1. 20260718_cron_runs_and_producers.sql is applied (table + producer fns),
--   2. the process-notifications edge fn is deployed (verify_jwt=false) and its
--      NOTIFY_FN_SECRET env == the Vault secret 'process_notifications_invoke_secret',
--   3. the 5 Vercel crons are retired (vercel.json "crons" emptied & deployed),
--   4. isolation verification passed (test event -> curl -> sent + resend_id).
--
-- Cadences mirror the retired vercel.json crons (all UTC; DB timezone is UTC):
--   notifications  */5 * * * *     (drain queue -> Resend, via edge fn)
--   reminders      0 18 * * *      (producer: tomorrow's appts)
--   low-stock      0 8 * * 1-5     (producer: weekdays)
--   recall         10 18 * * *     (producer: 3-touch)
--   stock-metrics  55 21 * * *     (producer: snapshot RPC wrapper)
--
-- Idempotent: re-running unschedules the 5 jobs by name, then re-creates them.

-- ── Clean slate (idempotent re-apply) ────────────────────────────────────────
DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'ds-drain-notifications',
      'ds-reminders',
      'ds-recall',
      'ds-low-stock',
      'ds-stock-metrics'
    )
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

-- ── Sender: drain notification_events -> Resend (every 5 min) ─────────────────
-- pg_net fire-and-forget POST to the edge fn. Bearer is read from Vault by name
-- at run time (never committed). Outcome shows in net._http_response + cron_runs
-- + edge logs, NOT in cron.job_run_details (which only confirms the enqueue).
SELECT cron.schedule(
  'ds-drain-notifications',
  '*/5 * * * *',
  $cmd$
  SELECT net.http_post(
    url     := 'https://exgpwtyrkkhwqqdgqbkz.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization',
                 'Bearer ' || (
                   SELECT decrypted_secret
                   FROM vault.decrypted_secrets
                   WHERE name = 'process_notifications_invoke_secret'
                 )
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $cmd$
);

-- ── Producer: appointment reminders (daily 18:00 UTC) ────────────────────────
SELECT cron.schedule(
  'ds-reminders',
  '0 18 * * *',
  $cmd$ SELECT public.run_reminders_job(); $cmd$
);

-- ── Producer: recall 3-touch (daily 18:10 UTC) ───────────────────────────────
SELECT cron.schedule(
  'ds-recall',
  '10 18 * * *',
  $cmd$ SELECT public.run_recall_job(); $cmd$
);

-- ── Producer: low-stock alerts (weekdays 08:00 UTC) ──────────────────────────
SELECT cron.schedule(
  'ds-low-stock',
  '0 8 * * 1-5',
  $cmd$ SELECT public.run_low_stock_job(); $cmd$
);

-- ── Producer: stock-metrics snapshot (daily 21:55 UTC) ───────────────────────
SELECT cron.schedule(
  'ds-stock-metrics',
  '55 21 * * *',
  $cmd$ SELECT public.run_stock_metrics_job(); $cmd$
);
