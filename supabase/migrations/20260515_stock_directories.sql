-- Phase 2: directories — brands, categories, enrich suppliers.
--
-- Idempotent. Runs AFTER 20260501_stock_posting_primitive.sql.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enrich material_suppliers with full directory fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.material_suppliers
  ADD COLUMN IF NOT EXISTS name_en           TEXT,
  ADD COLUMN IF NOT EXISTS name_pl           TEXT,
  ADD COLUMN IF NOT EXISTS legal_name        TEXT,
  ADD COLUMN IF NOT EXISTS edrpou            VARCHAR(10),
  ADD COLUMN IF NOT EXISTS vat_number        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS legal_address     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address  TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS email             TEXT,
  ADD COLUMN IF NOT EXISTS website           TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms     TEXT,
  ADD COLUMN IF NOT EXISTS contact_person    TEXT,
  ADD COLUMN IF NOT EXISTS sort_order        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. material_brands
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.material_brands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk     TEXT        NOT NULL,
  name_en     TEXT,
  name_pl     TEXT,
  country     TEXT,
  website     TEXT,
  logo_url    TEXT,
  comment     TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_archived BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.material_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS brands_admin_rw ON public.material_brands
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. material_categories — self-referencing hierarchy (up to 3 levels)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.material_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk     TEXT        NOT NULL,
  name_en     TEXT,
  name_pl     TEXT,
  parent_id   UUID        REFERENCES public.material_categories(id) ON DELETE SET NULL,
  color       VARCHAR(7),           -- hex colour for UI
  icon        TEXT,                 -- lucide icon name
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_archived BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT max_depth CHECK (parent_id IS NULL OR parent_id <> id)
);

ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS categories_admin_rw ON public.material_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Enrich materials table with v2 directory FKs + barcode
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS brand_id          UUID REFERENCES public.material_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_v2_id    UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id       UUID REFERENCES public.material_suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS barcode           TEXT,
  ADD COLUMN IF NOT EXISTS sku               TEXT,
  ADD COLUMN IF NOT EXISTS pack_size         NUMERIC(10,4) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pack_unit         TEXT DEFAULT 'шт',
  ADD COLUMN IF NOT EXISTS description_uk    TEXT,
  ADD COLUMN IF NOT EXISTS description_en    TEXT,
  ADD COLUMN IF NOT EXISTS is_active         BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS materials_barcode_uidx
  ON public.materials(barcode) WHERE barcode IS NOT NULL AND barcode <> '';

CREATE UNIQUE INDEX IF NOT EXISTS materials_sku_uidx
  ON public.materials(sku) WHERE sku IS NOT NULL AND sku <> '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Seed: migrate existing materials.category (enum) → category_v2_id
--    Creates one category_v2 row per distinct legacy category value.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
  v_cat_id UUID;
BEGIN
  -- Enumerate distinct legacy categories that exist in the materials table
  FOR r IN
    SELECT DISTINCT category FROM materials WHERE category IS NOT NULL
  LOOP
    SELECT id INTO v_cat_id
      FROM material_categories
     WHERE name_uk = r.category
     LIMIT 1;

    IF v_cat_id IS NULL THEN
      INSERT INTO material_categories(name_uk, sort_order)
        VALUES (r.category, 0)
        RETURNING id INTO v_cat_id;
    END IF;

    UPDATE materials SET category_v2_id = v_cat_id WHERE category = r.category;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Seed directories from preprod seed script placeholders
-- ─────────────────────────────────────────────────────────────────────────────

-- Sample brands (idempotent via WHERE NOT EXISTS)
INSERT INTO material_brands(name_uk, country, sort_order)
SELECT v.name, v.country, v.sort
  FROM (VALUES
    ('3M ESPE',       'США',      10),
    ('DENTSPLY',      'США',      20),
    ('GC Corporation','Японія',   30),
    ('Ivoclar Vivadent','Ліхтенштейн', 40),
    ('VOCO',          'Німеччина', 50)
  ) AS v(name, country, sort)
 WHERE NOT EXISTS (SELECT 1 FROM material_brands WHERE name_uk = v.name);

-- Sample categories (idempotent)
INSERT INTO material_categories(name_uk, sort_order)
SELECT v.name, v.sort
  FROM (VALUES
    ('Композит',        1),
    ('Пломбувальний',   2),
    ('Інструментарій',  3),
    ('Імплантологія',   4),
    ('Гігієна',         5),
    ('Анестезія',       6),
    ('Інше',            99)
  ) AS v(name, sort)
 WHERE NOT EXISTS (SELECT 1 FROM material_categories WHERE name_uk = v.name);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Audit log
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO admin_audit_logs(actor_id, action, entity_type, entity_id, metadata)
SELECT NULL,
       'stock_phase2.directories',
       'migrations',
       gen_random_uuid(),
       jsonb_build_object('run_at', now(), 'migration', '20260515_stock_directories.sql')
ON CONFLICT DO NOTHING;

COMMIT;
