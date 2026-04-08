-- Add billing_manager role for financial/accounting staff.
-- Billing manager has read-only access to analytics and financial data.

BEGIN;

-- Expand the role constraint to include billing_manager
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (
    'superadmin',
    'admin',
    'receptionist',
    'doctor',
    'senior_assistant',
    'assistant',
    'staff',           -- kept for backwards compat; treat as assistant in app
    'billing_manager'  -- NEW: accountant / financial officer
  ));

COMMIT;
