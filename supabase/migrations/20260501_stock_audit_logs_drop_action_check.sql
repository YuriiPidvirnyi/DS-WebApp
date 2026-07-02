-- Inventory v2 uses free-form action names (stock_document.post, calc_cards.substitute, etc.).
-- Drop the old CHECK that only allowed INSERT/UPDATE/DELETE.
ALTER TABLE public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_action_check;
