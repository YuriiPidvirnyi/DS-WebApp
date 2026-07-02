-- Phase 8: daily stock metrics snapshot
-- Populated by /api/cron/stock-metrics at 23:55 Kyiv (21:55 UTC)

CREATE TABLE IF NOT EXISTS public.stock_metrics_daily (
  day DATE PRIMARY KEY,
  posted_docs_count JSONB NOT NULL DEFAULT '{}'::jsonb,
  audits_posted_count INT NOT NULL DEFAULT 0,
  users_active_count INT NOT NULL DEFAULT 0,
  stockout_events_count INT NOT NULL DEFAULT 0,
  critical_low_materials_count INT NOT NULL DEFAULT 0,
  writeoff_autopost_failures INT NOT NULL DEFAULT 0,
  avg_material_cost_per_treatment NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_metrics_daily_admin_read" ON public.stock_metrics_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
        AND au.role IN ('superadmin','admin','inventory_manager','analyst')
    )
  );

-- ── Snapshot function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.snapshot_stock_metrics_daily(p_day DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_posted_docs   JSONB;
  v_audits        INT;
  v_active_users  INT;
  v_stockouts     INT;
  v_critical_low  INT;
  v_avg_cost      NUMERIC(14,2);
BEGIN
  -- doc counts grouped by type posted on p_day
  SELECT jsonb_object_agg(doc_type, cnt)
  INTO v_posted_docs
  FROM (
    SELECT doc_type, COUNT(*) AS cnt
    FROM public.stock_documents
    WHERE status = 'posted'
      AND posted_at::DATE = p_day
    GROUP BY doc_type
  ) t;

  -- audits posted on p_day
  SELECT COUNT(*) INTO v_audits
  FROM public.inventory_audits
  WHERE status = 'posted'
    AND audit_date = p_day;

  -- distinct admin_users who authored a stock doc on p_day
  SELECT COUNT(DISTINCT responsible_user_id) INTO v_active_users
  FROM public.stock_documents
  WHERE created_at::DATE = p_day;

  -- materials with qty = 0 at end of p_day (proxy for stockout events)
  SELECT COUNT(*) INTO v_stockouts
  FROM public.material_inventory mi
  WHERE mi.current_quantity = 0;

  -- materials currently below critical_level
  SELECT COUNT(*) INTO v_critical_low
  FROM public.material_inventory mi
  WHERE mi.critical_level_unit_qty IS NOT NULL
    AND mi.current_quantity < mi.critical_level_unit_qty
    AND mi.current_quantity > 0;

  -- avg material cost per treatment for treatments completed on p_day
  SELECT AVG(line_total_per_treatment) INTO v_avg_cost
  FROM (
    SELECT tr.id, SUM(sdi.unit_cost * sdi.unit_qty) AS line_total_per_treatment
    FROM public.treatment_records tr
    JOIN public.stock_documents sd ON sd.treatment_record_id = tr.id
    JOIN public.stock_document_items sdi ON sdi.stock_document_id = sd.id
    WHERE sd.doc_type = 'writeoff'
      AND sd.status = 'posted'
      AND sd.posted_at::DATE = p_day
    GROUP BY tr.id
  ) t;

  INSERT INTO public.stock_metrics_daily (
    day,
    posted_docs_count,
    audits_posted_count,
    users_active_count,
    stockout_events_count,
    critical_low_materials_count,
    writeoff_autopost_failures,
    avg_material_cost_per_treatment
  )
  VALUES (
    p_day,
    COALESCE(v_posted_docs, '{}'::jsonb),
    COALESCE(v_audits, 0),
    COALESCE(v_active_users, 0),
    COALESCE(v_stockouts, 0),
    COALESCE(v_critical_low, 0),
    0,  -- writeoff_autopost_failures tracked via Sentry, not counted here
    v_avg_cost
  )
  ON CONFLICT (day) DO UPDATE SET
    posted_docs_count               = EXCLUDED.posted_docs_count,
    audits_posted_count             = EXCLUDED.audits_posted_count,
    users_active_count              = EXCLUDED.users_active_count,
    stockout_events_count           = EXCLUDED.stockout_events_count,
    critical_low_materials_count    = EXCLUDED.critical_low_materials_count,
    avg_material_cost_per_treatment = EXCLUDED.avg_material_cost_per_treatment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.snapshot_stock_metrics_daily(DATE) TO service_role;
