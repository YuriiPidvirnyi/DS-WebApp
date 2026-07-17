-- Review link click tracking for the Google review funnel.
--
-- The printed QR codes / emails point at /r/google?src=<channel> on our own
-- domain (UTM params are useless on google.com URLs). The route handler logs
-- one row per hit and 302-redirects to the Google write-review URL, giving
-- per-channel scan/click counts without a third-party QR service.

BEGIN;

CREATE TABLE public.review_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src TEXT NOT NULL DEFAULT 'unknown',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_link_clicks_src_created
  ON public.review_link_clicks (src, created_at DESC);

ALTER TABLE public.review_link_clicks ENABLE ROW LEVEL SECURITY;

-- Inserts happen only from the server route via the service-role key (bypasses
-- RLS). Admins can read the funnel numbers; no public access at all.
CREATE POLICY "review_link_clicks_admin_read" ON public.review_link_clicks
  FOR SELECT USING (public.is_admin());

COMMIT;
