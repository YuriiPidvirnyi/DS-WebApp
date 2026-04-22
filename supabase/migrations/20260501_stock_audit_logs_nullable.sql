-- admin_audit_logs: allow table_name to be NULL for inventory-v2 audit entries
-- that use entity_type/entity_id instead of the old table_name/record_id pattern.
ALTER TABLE public.admin_audit_logs
  ALTER COLUMN table_name DROP NOT NULL;
