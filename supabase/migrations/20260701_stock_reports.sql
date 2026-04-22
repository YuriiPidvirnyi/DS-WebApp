BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 7: Report SQL functions
-- 1. report_balances        — current stock with weighted avg cost
-- 2. report_product_history — per-material/warehouse movement ledger
-- 3. report_critical_stock_reorder — below-critical items with suggested PO qty
-- 4. report_writeoff        — write-off documents with treatment linkage
-- 5. report_service_cost    — FIFO-based service margin per month
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Balances ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.report_balances(
  p_warehouse_id  UUID    DEFAULT NULL,
  p_category_id   UUID    DEFAULT NULL,
  p_brand_id      UUID    DEFAULT NULL,
  p_material_id   UUID    DEFAULT NULL,
  p_balance_state TEXT    DEFAULT 'all',  -- 'all' | 'positive' | 'negative' | 'zero'
  p_critical_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  material_id         UUID,
  material_name       TEXT,
  category            TEXT,
  brand               TEXT,
  unit                TEXT,
  warehouse_id        UUID,
  warehouse_name      TEXT,
  qty                 NUMERIC,
  critical_level      NUMERIC,
  status              TEXT,
  weighted_avg_cost   NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id,
    m.name_uk,
    COALESCE(mc.name_uk, m.category),
    mb.name_uk,
    m.pack_size_unit,
    sw.id,
    sw.name_uk,
    mi.current_quantity,
    mi.critical_level_unit_qty,
    CASE
      WHEN mi.current_quantity <= 0                              THEN 'out'
      WHEN mi.current_quantity < COALESCE(mi.critical_level_unit_qty, 0) THEN 'critical'
      ELSE 'ok'
    END,
    (
      SELECT SUM(sl.qty_remaining * sl.unit_cost) / NULLIF(SUM(sl.qty_remaining), 0)
        FROM stock_lots sl
       WHERE sl.material_id = m.id
         AND sl.warehouse_id = sw.id
         AND sl.qty_remaining > 0
    )
  FROM materials m
  LEFT JOIN material_categories mc ON mc.id = m.category_v2_id
  LEFT JOIN material_brands mb     ON mb.id = m.brand_id
  JOIN material_inventory mi       ON mi.material_id = m.id
  JOIN stock_warehouses sw         ON sw.id = mi.warehouse_id
  WHERE m.is_active AND NOT sw.is_archived
    AND (p_warehouse_id IS NULL OR sw.id        = p_warehouse_id)
    AND (p_category_id  IS NULL OR m.category_v2_id = p_category_id)
    AND (p_brand_id     IS NULL OR m.brand_id   = p_brand_id)
    AND (p_material_id  IS NULL OR m.id         = p_material_id)
    AND (NOT p_critical_only OR mi.current_quantity < COALESCE(mi.critical_level_unit_qty, 0))
    AND (
      p_balance_state = 'all'
      OR (p_balance_state = 'positive'  AND mi.current_quantity  > 0)
      OR (p_balance_state = 'negative'  AND mi.current_quantity  < 0)
      OR (p_balance_state = 'zero'      AND mi.current_quantity  = 0)
    )
  ORDER BY sw.sort_order, COALESCE(mc.name_uk, m.category), m.name_uk;
$$;

-- ── 2. Product history ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.report_product_history(
  p_material_id  UUID,
  p_warehouse_id UUID,
  p_from         DATE,
  p_to           DATE
)
RETURNS TABLE (
  event_at        TIMESTAMPTZ,
  doc_type        TEXT,
  doc_number      TEXT,
  qty_delta       NUMERIC,
  unit_cost       NUMERIC,
  running_balance NUMERIC,
  actor           TEXT,
  comment         TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH events AS (
    SELECT sd.posted_at AS event_at,
           sd.doc_type,
           sd.doc_number,
           CASE
             WHEN sd.doc_type = 'incoming'   AND sd.warehouse_to_id   = p_warehouse_id THEN  sdi.unit_qty
             WHEN sd.doc_type = 'writeoff'   AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type = 'return'     AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type = 'transfer'   AND sd.warehouse_from_id = p_warehouse_id THEN -sdi.unit_qty
             WHEN sd.doc_type = 'transfer'   AND sd.warehouse_to_id   = p_warehouse_id THEN  sdi.unit_qty
             WHEN sd.doc_type = 'adjustment' AND sd.warehouse_from_id = p_warehouse_id THEN  sdi.unit_qty
           END AS qty_delta,
           sdi.unit_cost,
           au.display_name AS actor,
           sd.comment
      FROM stock_documents sd
      JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
 LEFT JOIN admin_users au           ON au.id = sd.posted_by
     WHERE sdi.material_id = p_material_id
       AND (sd.warehouse_from_id = p_warehouse_id OR sd.warehouse_to_id = p_warehouse_id)
       AND sd.status = 'posted'
       AND sd.posted_at::date BETWEEN p_from AND p_to
  )
  SELECT event_at, doc_type, doc_number, qty_delta, unit_cost,
         SUM(qty_delta) OVER (ORDER BY event_at, doc_number) AS running_balance,
         actor, comment
    FROM events
   WHERE qty_delta IS NOT NULL AND qty_delta <> 0
   ORDER BY event_at DESC, doc_number DESC;
$$;

-- ── 3. Critical-stock reorder suggestion ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.report_critical_stock_reorder()
RETURNS TABLE (
  supplier_id         UUID,
  supplier_name       TEXT,
  material_id         UUID,
  material_name       TEXT,
  category            TEXT,
  warehouse_id        UUID,
  warehouse_name      TEXT,
  qty                 NUMERIC,
  critical_level      NUMERIC,
  suggested_order_qty NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.supplier_id,
    ms.name,
    m.id,
    m.name_uk,
    COALESCE(mc.name_uk, m.category),
    sw.id,
    sw.name_uk,
    mi.current_quantity,
    mi.critical_level_unit_qty,
    COALESCE(
      mi.default_reorder_unit_qty,
      GREATEST(COALESCE(mi.critical_level_unit_qty, 0) * 2 - mi.current_quantity, 0)
    )
  FROM material_inventory mi
  JOIN materials m             ON m.id = mi.material_id
  LEFT JOIN material_suppliers ms ON ms.id = m.supplier_id
  LEFT JOIN material_categories mc ON mc.id = m.category_v2_id
  JOIN stock_warehouses sw     ON sw.id = mi.warehouse_id
  WHERE m.is_active AND NOT sw.is_archived
    AND mi.current_quantity < COALESCE(mi.critical_level_unit_qty, 0)
  ORDER BY ms.name NULLS LAST, COALESCE(mc.name_uk, m.category), m.name_uk;
$$;

-- ── 4. Write-off report ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.report_writeoff(
  p_from         DATE,
  p_to           DATE,
  p_warehouse_id UUID  DEFAULT NULL,
  p_doctor_id    UUID  DEFAULT NULL,
  p_service_id   UUID  DEFAULT NULL
)
RETURNS TABLE (
  doc_id      UUID,
  doc_number  TEXT,
  posted_at   TIMESTAMPTZ,
  warehouse   TEXT,
  doctor      TEXT,
  service     TEXT,
  material    TEXT,
  unit_qty    NUMERIC,
  unit_cost   NUMERIC,
  line_total  NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    sd.id,
    sd.doc_number,
    sd.posted_at,
    sw.name_uk,
    CONCAT_WS(' ', d.last_name, d.first_name),
    s.name_uk,
    m.name_uk,
    sdi.unit_qty,
    sdi.unit_cost,
    sdi.line_total
  FROM stock_documents sd
  JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
  JOIN materials m               ON m.id = sdi.material_id
  JOIN stock_warehouses sw       ON sw.id = sd.warehouse_from_id
  LEFT JOIN treatment_records tr ON tr.id = sd.treatment_record_id
  LEFT JOIN doctors d            ON d.id  = tr.doctor_id
  LEFT JOIN LATERAL (
    SELECT sv.name_uk
      FROM treatment_record_items tri
      JOIN services sv ON sv.id = tri.service_id
     WHERE tri.treatment_record_id = tr.id
     ORDER BY tri.created_at LIMIT 1
  ) s ON true
  WHERE sd.doc_type = 'writeoff' AND sd.status = 'posted'
    AND sd.posted_at::date BETWEEN p_from AND p_to
    AND (p_warehouse_id IS NULL OR sd.warehouse_from_id = p_warehouse_id)
    AND (p_doctor_id    IS NULL OR tr.doctor_id         = p_doctor_id)
    AND (p_service_id   IS NULL OR EXISTS (
          SELECT 1 FROM treatment_record_items x
           WHERE x.treatment_record_id = tr.id AND x.service_id = p_service_id
        ))
  ORDER BY sd.posted_at DESC, sd.doc_number DESC;
$$;

-- ── 5. Service cost / margin ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.report_service_cost(
  p_from DATE,
  p_to   DATE
)
RETURNS TABLE (
  service             TEXT,
  month               TIMESTAMPTZ,
  n_performed         BIGINT,
  avg_price           NUMERIC,
  avg_material_cost   NUMERIC,
  avg_margin          NUMERIC,
  total_margin        NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.name_uk,
    DATE_TRUNC('month', tr.created_at),
    COUNT(*),
    AVG(tri.price_at_time),
    AVG(COALESCE(mc.material_cost_sum, 0)),
    AVG(tri.price_at_time - COALESCE(mc.material_cost_sum, 0)),
    SUM(tri.price_at_time - COALESCE(mc.material_cost_sum, 0))
  FROM treatment_records tr
  JOIN treatment_record_items tri ON tri.treatment_record_id = tr.id
  JOIN services s                 ON s.id = tri.service_id
  LEFT JOIN LATERAL (
    SELECT SUM(sdi.unit_qty * sdi.unit_cost) AS material_cost_sum
      FROM stock_documents sd
      JOIN stock_document_items sdi ON sdi.stock_document_id = sd.id
     WHERE sd.treatment_record_id = tr.id
       AND sd.doc_type = 'writeoff' AND sd.status = 'posted'
  ) mc ON true
  WHERE tr.status = 'completed'
    AND tr.created_at::date BETWEEN p_from AND p_to
  GROUP BY s.name_uk, DATE_TRUNC('month', tr.created_at)
  ORDER BY DATE_TRUNC('month', tr.created_at) DESC, SUM(tri.price_at_time - COALESCE(mc.material_cost_sum, 0)) DESC;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.report_balances           TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_product_history    TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_critical_stock_reorder TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_writeoff           TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_service_cost       TO authenticated;

COMMIT;
