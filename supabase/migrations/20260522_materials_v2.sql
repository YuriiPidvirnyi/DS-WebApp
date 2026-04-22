-- Phase 3: pack/unit, multi-barcode, per-warehouse matrix
-- Extends materials + material_inventory for v2 product card UI

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. materials: add pack/unit columns, multi-barcode, article code
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS pack_format_label    TEXT,                         -- e.g. 'Упаковка','Банка','Флакон'
  ADD COLUMN IF NOT EXISTS pack_size_numerator  NUMERIC(14,4) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pack_size_unit       TEXT NOT NULL DEFAULT 'шт'
    CHECK (pack_size_unit IN ('шт','г','кг','мл','л','см','м','пара','набір')),
  ADD COLUMN IF NOT EXISTS barcodes             TEXT[] NOT NULL DEFAULT '{}', -- multi-barcode (scanner)
  ADD COLUMN IF NOT EXISTS article_code         TEXT;                         -- internal SKU / article

-- GIN index for fast @> / ANY barcode lookups
CREATE INDEX IF NOT EXISTS idx_materials_barcodes ON public.materials USING GIN (barcodes);
CREATE INDEX IF NOT EXISTS idx_materials_article   ON public.materials (article_code);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. material_inventory: add per-warehouse threshold + visibility matrix
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.material_inventory
  ADD COLUMN IF NOT EXISTS critical_level_unit_qty  NUMERIC(14,4),    -- warehouse-level critical threshold
  ADD COLUMN IF NOT EXISTS default_reorder_unit_qty NUMERIC(14,4),    -- default qty pre-filled on PO
  ADD COLUMN IF NOT EXISTS is_visible                BOOLEAN NOT NULL DEFAULT true; -- hide from warehouse card

COMMIT;
