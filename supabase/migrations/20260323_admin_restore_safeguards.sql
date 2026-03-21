-- Adds rollback safeguard metadata and requires explicit reason/comment on restore.

CREATE TABLE IF NOT EXISTS public.admin_audit_restore_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES public.admin_audit_logs(id) ON DELETE CASCADE,
  restored_table TEXT NOT NULL,
  restored_record_id UUID NOT NULL,
  reverted_action TEXT NOT NULL CHECK (reverted_action IN ('INSERT', 'UPDATE', 'DELETE')),
  reason TEXT NOT NULL,
  comment TEXT,
  restored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_restore_events_restored_at
  ON public.admin_audit_restore_events(restored_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_restore_events_log_id
  ON public.admin_audit_restore_events(log_id);

ALTER TABLE public.admin_audit_restore_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_restore_events_admin_read" ON public.admin_audit_restore_events;
CREATE POLICY "admin_audit_restore_events_admin_read" ON public.admin_audit_restore_events
  FOR SELECT USING (public.is_admin_actor());

DROP FUNCTION IF EXISTS public.admin_restore_audit_log(UUID);
DROP FUNCTION IF EXISTS public.admin_restore_audit_log(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_restore_audit_log(
  p_log_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log public.admin_audit_logs%ROWTYPE;
  v_columns TEXT;
  v_upsert_set_columns TEXT;
  v_reason TEXT := NULLIF(TRIM(COALESCE(p_reason, '')), '');
  v_comment TEXT := NULLIF(TRIM(COALESCE(p_comment, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin_actor() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Restore reason is required';
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

  INSERT INTO public.admin_audit_restore_events (
    log_id,
    restored_table,
    restored_record_id,
    reverted_action,
    reason,
    comment,
    restored_by
  ) VALUES (
    v_log.id,
    v_log.table_name,
    v_log.record_id,
    v_log.action,
    v_reason,
    v_comment,
    auth.uid()
  );

  RETURN jsonb_build_object(
    'restored', true,
    'table', v_log.table_name,
    'record_id', v_log.record_id,
    'reverted_action', v_log.action,
    'reason', v_reason,
    'comment', v_comment
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_restore_audit_log(UUID, TEXT, TEXT) TO authenticated;
