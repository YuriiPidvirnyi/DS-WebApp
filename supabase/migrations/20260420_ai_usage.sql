-- AI token usage tracking (B1)
-- Logs every AI route invocation for cost monitoring and abuse control.

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL,           -- 'chat' | 'recommendations'
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 8) NOT NULL DEFAULT 0,
  ip_hash text NOT NULL,         -- SHA-256 of client IP, not raw IP
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for daily budget checks (ip_hash + time window)
CREATE INDEX ai_usage_ip_hash_created_at_idx ON ai_usage (ip_hash, created_at DESC);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Service role can insert (API routes run with service role key via supabase-js server client)
CREATE POLICY "ai_usage_service_insert" ON ai_usage
  FOR INSERT TO service_role WITH CHECK (true);

-- Superadmin and analyst can read all rows
CREATE POLICY "ai_usage_admin_read" ON ai_usage
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
        AND role IN ('superadmin', 'analyst')
    )
  );
