-- Admin audit trail + generic restore for key admin-managed entities.
-- Covers doctors, services, appointments, reviews, contact_submissions.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  before_data JSONB,
  after_data JSONB,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_changed_at
  ON public.admin_audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_table_record
  ON public.admin_audit_logs(table_name, record_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_actor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
    AND EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.id = auth.uid()
    );
$$;

DROP POLICY IF EXISTS "admin_audit_logs_admin_read" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_admin_read" ON public.admin_audit_logs
  FOR SELECT USING (public.is_admin_actor());

CREATE OR REPLACE FUNCTION public.capture_admin_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_record_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
    v_record_id := OLD.id;
  ELSE
    RETURN NULL;
  END IF;

  INSERT INTO public.admin_audit_logs (
    table_name,
    record_id,
    action,
    before_data,
    after_data,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_before,
    v_after,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_audit_doctors ON public.doctors;
CREATE TRIGGER trg_admin_audit_doctors
AFTER INSERT OR UPDATE OR DELETE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_log();

DROP TRIGGER IF EXISTS trg_admin_audit_services ON public.services;
CREATE TRIGGER trg_admin_audit_services
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_log();

DROP TRIGGER IF EXISTS trg_admin_audit_appointments ON public.appointments;
CREATE TRIGGER trg_admin_audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_log();

DROP TRIGGER IF EXISTS trg_admin_audit_reviews ON public.reviews;
CREATE TRIGGER trg_admin_audit_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_log();

DROP TRIGGER IF EXISTS trg_admin_audit_contact_submissions ON public.contact_submissions;
CREATE TRIGGER trg_admin_audit_contact_submissions
AFTER INSERT OR UPDATE OR DELETE ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit_log();

CREATE OR REPLACE FUNCTION public.admin_restore_audit_log(p_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log public.admin_audit_logs%ROWTYPE;
  v_columns TEXT;
  v_upsert_set_columns TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin_actor() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT *
  INTO v_log
  FROM public.admin_audit_logs
  WHERE id = p_log_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit record not found';
  END IF;

  IF v_log.table_name NOT IN (
    'doctors',
    'services',
    'appointments',
    'reviews',
    'contact_submissions'
  ) THEN
    RAISE EXCEPTION 'Unsupported table for restore: %', v_log.table_name;
  END IF;

  SELECT
    string_agg(format('%I', c.column_name), ', ' ORDER BY c.ordinal_position),
    string_agg(format('%1$I = EXCLUDED.%1$I', c.column_name), ', ' ORDER BY c.ordinal_position)
  INTO v_columns, v_upsert_set_columns
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = v_log.table_name
    AND c.is_generated = 'NEVER';

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'No restorable columns found for table: %', v_log.table_name;
  END IF;

  IF v_log.action = 'INSERT' THEN
    EXECUTE format('DELETE FROM public.%I WHERE id = $1', v_log.table_name)
    USING v_log.record_id;
  ELSIF v_log.action IN ('UPDATE', 'DELETE') THEN
    IF v_log.before_data IS NULL THEN
      RAISE EXCEPTION 'before_data is empty for action %', v_log.action;
    END IF;

    EXECUTE format(
      'INSERT INTO public.%1$I (%2$s)
       SELECT %2$s
       FROM json_populate_record(NULL::public.%1$I, $1)
       ON CONFLICT (id)
       DO UPDATE SET %3$s',
      v_log.table_name,
      v_columns,
      v_upsert_set_columns
    )
    USING v_log.before_data;
  ELSE
    RAISE EXCEPTION 'Unsupported action for restore: %', v_log.action;
  END IF;

  RETURN jsonb_build_object(
    'restored', true,
    'table', v_log.table_name,
    'record_id', v_log.record_id,
    'reverted_action', v_log.action
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_restore_audit_log(UUID) TO authenticated;
