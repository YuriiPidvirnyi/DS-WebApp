-- Add inventory_manager and analyst roles for supply chain and business intelligence.
-- Inventory manager: manages materials, orders, and stock (no clinical access).
-- Analyst: read-only access to analytics and reporting data.

BEGIN;

-- Expand the role constraint to include inventory_manager and analyst
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
    'staff',
    'billing_manager',
    'inventory_manager',  -- NEW: supply chain coordinator
    'analyst'             -- NEW: business intelligence / reporting
  ));

COMMIT;
