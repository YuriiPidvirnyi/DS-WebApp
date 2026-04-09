-- Remove senior_assistant and staff roles from the system.
-- senior_assistant: only 2 extra perms over assistant, no practical use without role-assignment UI
-- staff: exact clone of assistant, legacy alias with zero value
--
-- Migration path: reassign existing users → assistant, then tighten CHECK constraint.

BEGIN;

-- 1. Migrate existing users to 'assistant'
UPDATE public.admin_users
SET role = 'assistant'
WHERE role IN ('senior_assistant', 'staff');

-- 2. Replace CHECK constraint to only allow 8 roles
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (
    'superadmin',
    'admin',
    'receptionist',
    'doctor',
    'assistant',
    'billing_manager',
    'inventory_manager',
    'analyst'
  ));

COMMIT;
