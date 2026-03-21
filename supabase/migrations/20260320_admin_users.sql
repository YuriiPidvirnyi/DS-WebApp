-- Admin users table for role management and audit trail.
-- Source of truth for admin access checks in app code.

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- RLS: users can only read their own membership row.
-- Admin table management should be done through SQL Editor/service role.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_superadmin_all" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;

CREATE POLICY "admin_users_self_read" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

-- Note: To create an admin user, run in Supabase SQL Editor:
-- 1. Create user via Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Add to admin_users table:
--    INSERT INTO public.admin_users (id, role, display_name) VALUES ('<user-uuid>', 'superadmin', 'Admin');
-- 3. Admin auth checks and RLS use admin_users membership as the source of truth.
