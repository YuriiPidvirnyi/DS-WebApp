-- Phase 8: inventory-v2 housekeeping
-- Applied after all phases 1–7 have shipped green on preprod.
-- Safe to run multiple times (idempotent).

-- ── Indexes added after observing slow queries in preprod ─────────────────────

CREATE INDEX IF NOT EXISTS idx_stock_documents_posted_at
  ON public.stock_documents (posted_at DESC NULLS LAST)
  WHERE status = 'posted';

CREATE INDEX IF NOT EXISTS idx_sdi_material_2
  ON public.stock_document_items (material_id);

CREATE INDEX IF NOT EXISTS idx_sdi_document_2
  ON public.stock_document_items (stock_document_id);

CREATE INDEX IF NOT EXISTS idx_material_inventory_qty
  ON public.material_inventory (current_quantity)
  WHERE current_quantity <= 0;

CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_audit
  ON public.inventory_audit_items (audit_id);

CREATE INDEX IF NOT EXISTS idx_calc_card_items_material
  ON public.service_calculation_card_items (material_id);

-- ── Tighten NOT NULL where safe ───────────────────────────────────────────────

-- stock_document_lines.material_id should always be set for v2 docs
-- (legacy v1 rows via treatment_materials_used may be null; skip those)
-- Nothing to ALTER here — enforced at app layer for v2 paths.

-- ── Drop no-longer-needed helper view if it exists ────────────────────────────

DROP VIEW IF EXISTS public.v_stock_low_materials;

-- ── Ensure stock_metrics_daily row for today exists (safe idempotent call) ────

SELECT public.snapshot_stock_metrics_daily(CURRENT_DATE);
