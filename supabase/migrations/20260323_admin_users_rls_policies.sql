-- Ensure admin_users remains queryable for role resolution while preserving strict control.
-- Without explicit policies, RLS blocks `getAdminAccess()` from reading a user's own admin row.

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
CREATE POLICY "admin_users_self_read" ON public.admin_users
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "admin_users_admin_manage" ON public.admin_users;
CREATE POLICY "admin_users_admin_manage" ON public.admin_users
  FOR ALL
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());
