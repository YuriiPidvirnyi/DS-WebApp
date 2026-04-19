CREATE TABLE public.cron_runs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,           -- e.g. 'notifications', 'reminders', 'low-stock-alerts'
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  duration_ms  integer     GENERATED ALWAYS AS (
                 EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000
               )::integer STORED,
  processed    integer     NOT NULL DEFAULT 0,
  error        text,
  status       text        NOT NULL DEFAULT 'running'  -- 'running' | 'ok' | 'error'
);
CREATE INDEX cron_runs_name_started_at_idx ON public.cron_runs (name, started_at DESC);
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
-- Admins can read, service role writes (RLS bypassed for service role)
CREATE POLICY "cron_runs_admin_read"
  ON public.cron_runs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );
