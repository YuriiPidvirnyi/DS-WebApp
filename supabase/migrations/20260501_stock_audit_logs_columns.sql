-- Extend admin_audit_logs with inventory-v2 fields used by stock RPCs.
-- Applied as an emergency fix during live deployment of inventory v2.
ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS actor_id    UUID,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id   UUID,
  ADD COLUMN IF NOT EXISTS metadata    JSONB;
