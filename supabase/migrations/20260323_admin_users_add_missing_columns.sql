-- Backfill columns for already-existing admin_users tables.
-- Some environments may have created admin_users before display_name/last_login_at were introduced.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
